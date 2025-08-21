import type { NextApiRequest, NextApiResponse } from 'next';

import crypto from 'crypto';

import { base } from '../constants';


function generateToken(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { refreshToken, accessToken } = req.body;

  if (!refreshToken || !accessToken) {
    return res.status(400).json({ message: 'Les tokens sont requis' });
  }

  try {
    // 🔍 Vérifier refreshToken
    const refreshRecords = await base('AUTH_REFRESH_TOKEN')
      .select({
        filterByFormula: `{token} = '${refreshToken}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (refreshRecords.length === 0) {
      return res.status(401).json({ message: 'Refresh token invalide' });
    }

    const refreshRecord = refreshRecords[0];
    const expiresAt = refreshRecord.get('expires_at') as string;
    const userId = (refreshRecord.get('user') as string[])?.[0];

    if (new Date(expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Refresh token expiré' });
    }

    // 🧹 Supprimer l'ancien refreshToken
    await base('AUTH_REFRESH_TOKEN').destroy(refreshRecord.id);

    // 🧹 Supprimer l'ancien accessToken
    const accessRecords = await base('AUTH_ACCESS_TOKEN')
      .select({
        filterByFormula: `{token} = '${accessToken}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (accessRecords.length > 0) {
      await base('AUTH_ACCESS_TOKEN').destroy(accessRecords[0].id);
    }

    // 🔐 Créer les nouveaux tokens
    const newAccessToken = generateToken(32);
    const newRefreshToken = generateToken(48);
    const now = Date.now();

    const expiresAtAccess = new Date(now + 60 * 60 * 1000).toISOString(); // 1h
    const expiresAtRefresh = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 jours

    await base('AUTH_ACCESS_TOKEN').create([
      {
        fields: {
          user: [userId],
          token: newAccessToken,
          expires_at: expiresAtAccess,
        },
      },
    ]);

    await base('AUTH_REFRESH_TOKEN').create([
      {
        fields: {
          user: [userId],
          token: newRefreshToken,
          expires_at: expiresAtRefresh,
        },
      },
    ]);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAtAccess,
      expiresAtRefresh,
    });
  } catch (error) {
    console.error('Erreur lors du refresh :', error);

    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
