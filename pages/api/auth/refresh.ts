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

  // Vérification de sécurité : s'assurer que les tokens ont le bon format
  if (typeof refreshToken !== 'string' || refreshToken.length < 32) {
    return res.status(400).json({ message: 'Format de refresh token invalide' });
  }

  if (typeof accessToken !== 'string' || accessToken.length < 32) {
    return res.status(400).json({ message: 'Format d\'access token invalide' });
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

    // 🧹 Supprimer TOUS les anciens tokens de cet utilisateur (rotation complète)
    await base('AUTH_REFRESH_TOKEN').destroy(refreshRecord.id);

    // Supprimer tous les access tokens de cet utilisateur
    const userAccessRecords = await base('AUTH_ACCESS_TOKEN')
      .select({
        filterByFormula: `{user} = '${userId}'`,
      })
      .all();

    if (userAccessRecords.length > 0) {
      const accessTokenIds = userAccessRecords.map(record => record.id);
      await base('AUTH_ACCESS_TOKEN').destroy(accessTokenIds);
    }

    // Supprimer tous les autres refresh tokens de cet utilisateur (sécurité)
    const userRefreshRecords = await base('AUTH_REFRESH_TOKEN')
      .select({
        filterByFormula: `{user} = '${userId}'`,
      })
      .all();

    if (userRefreshRecords.length > 0) {
      const refreshTokenIds = userRefreshRecords.map(record => record.id);
      await base('AUTH_REFRESH_TOKEN').destroy(refreshTokenIds);
    }

    // 🔐 Créer les nouveaux tokens
    const newAccessToken = generateToken(32);
    const newRefreshToken = generateToken(48);
    const now = Date.now();

    const expiresAtAccess = new Date(now + 15 * 60 * 1000).toISOString(); // 15 minutes
    const expiresAtRefresh = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 jours

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

    // Récupérer les infos utilisateur à retourner (similaire à /api/auth/login)
    let userInfo = null;

    try {
      const userRecord = await base('COLLABORATEURS').find(userId);

      // construire la liste des villes liées à l'utilisateur
      let villesEpicu: { id: string; ville: string }[] = [];

      try {
        const linked = userRecord.get('Ville EPICU');
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

      userInfo = {
        id: userRecord.id,
        email: userRecord.get('Email perso'),
        firstname: userRecord.get('Prénom'),
        lastname: userRecord.get('Nom'),
        villes: villesEpicu,
        role: userRecord.get('Rôle')
      };
    } catch (e) {
      // ignore if user fetch fails
    }

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAtAccess,
      expiresAtRefresh,
      user: userInfo,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
