// pages/api/auth/validate-signup-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token requis' });
  }

  try {
    // Rechercher le token dans la table des tokens de signup
    const records = await base('SIGNUP_TOKENS')
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ message: 'Token invalide' });
    }

    const tokenRecord = records[0];
    const expiresAt = new Date(tokenRecord.get('expires_at') as string);
    const now = new Date();

    // Vérifier si le token a expiré
    if (now > expiresAt) {
      return res.status(400).json({ message: 'Token expiré' });
    }

    // Récupérer les informations de l'utilisateur
    const userId = tokenRecord.get('user_id') as string;
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
    const firstName = user.get('Prénom') as string;
    const lastName = user.get('Nom') as string;
    const userName = `${firstName} ${lastName}`.trim();

    return res.status(200).json({
      message: 'Token valide',
      userName,
      userId,
    });
  } catch (error) {
    console.error('Erreur de validation du token :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
