// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import crypto from 'crypto';

import bcrypt from 'bcrypt';

import { base } from '../constants';

function generateToken(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

function normalizeEmail(email: string): string {
  return email
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les diacritiques (accents)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  // Normaliser l'email d'entrée
  const normalizedEmail = normalizeEmail(email);

  try {
    // Récupérer tous les utilisateurs pour faire la comparaison côté serveur
    // car Airtable ne supporte pas bien la normalisation Unicode dans les formules
    const records = await base('COLLABORATEURS')
      .select({
        fields: ['Email perso', 'password', 'Prénom', 'Nom', 'Rôle', 'Ville EPICU'],
        maxRecords: 1000, // Limite raisonnable pour éviter de charger trop de données
      })
      .all();

    // Trouver l'utilisateur avec un email correspondant (comparaison normalisée)
    const user = records.find(record => {
      const storedEmail = record.get('Email perso') as string;
      if (!storedEmail) return false;
      const normalizedStoredEmail = normalizeEmail(storedEmail);
      return normalizedStoredEmail === normalizedEmail;
    });

    if (!user) {
      return res.status(401).json({ message: 'Compte introuvable' });
    }
    const hashedPassword = user.get('password') as string;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const accessToken = generateToken(32);
    const refreshToken = generateToken(48);
    const now = Date.now();

    await base('AUTH_ACCESS_TOKEN').create([
      {
        fields: {
          user: [user.id],
          token: accessToken,
          created_at: new Date(now).toISOString(),
          expires_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(), // 4 heures
        },
      },
    ]);

    await base('AUTH_REFRESH_TOKEN').create([
      {
        fields: {
          user: [user.id],
          token: refreshToken,
          created_at: new Date(now).toISOString(),
          expires_at: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
        },
      },
    ]);

    // fetch only villes epicu linked to this user (id + Ville EPICU)
    let villesEpicu: { id: string; ville: string }[] = [];

    try {
      const linked = user.get('Ville EPICU');
      let linkedIds: string[] = [];

      if (linked) {
        if (Array.isArray(linked)) linkedIds = linked;
        else if (typeof linked === 'string') linkedIds = [linked];
      }
      if (linkedIds.length > 0) {
        const v = await base('VILLES EPICU')
          .select({ filterByFormula: `OR(${linkedIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Ville EPICU'], maxRecords: linkedIds.length })
          .all();

        villesEpicu = v.map((r: any) => ({ id: r.id, ville: r.get('Ville EPICU') }));
      }
    } catch (e) {
      // ignore failures to fetch villes
    }

    return res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.get('Email perso'),
        firstname: user.get('Prénom'),
        lastname: user.get('Nom'),
        villes: villesEpicu,
        role: user.get('Rôle')
      },
      accessToken,
      refreshToken,
      expiresAtAccess: new Date(now + 4 * 60 * 60 * 1000).toISOString(), // 4 heures
      expiresAtRefresh: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
    });    
  } catch (error) {
    console.error('Erreur de login :', error);

    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
