// pages/api/auth/initialize-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import bcrypt from 'bcrypt';

import { base } from '../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token et mot de passe requis' });
  }

  try {
    // Rechercher le token dans la table des tokens de signup
    const tokenRecords = await base('SIGNUP_TOKENS')
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (tokenRecords.length === 0) {
      return res.status(404).json({ message: 'Token invalide' });
    }

    const tokenRecord = tokenRecords[0];
    const expiresAt = new Date(tokenRecord.get('expires_at') as string);
    const now = new Date();

    // Vérifier si le token a expiré
    if (now > expiresAt) {
      return res.status(400).json({ message: 'Token expiré' });
    }

    const userId = tokenRecord.get('user_id') as string;

    // Récupérer l'utilisateur
    const userRecords = await base('COLLABORATEURS')
      .select({
        filterByFormula: `RECORD_ID() = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const user = userRecords[0];

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Mettre à jour le mot de passe de l'utilisateur
    await base('COLLABORATEURS').update([
      {
        id: userId,
        fields: {
          password: hashedPassword,
        },
      },
    ]);

    // Supprimer le token de signup utilisé
    await base('SIGNUP_TOKENS').destroy([tokenRecord.id]);

    return res.status(200).json({
      message: 'Mot de passe initialisé avec succès',
    });
  } catch (error) {
    console.error('Erreur d\'initialisation du mot de passe :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
