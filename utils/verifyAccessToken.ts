import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

import { base } from '../pages/api/constants';

type VerifyResult = {
  valid: boolean;
  userId?: string;
  recordId?: string;
  reason?: string;
};

/**
 * Vérifie en base qu'un access token existe et n'est pas expiré.
 * Retourne un objet { valid, userId, recordId, reason }.
 */
export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: 'Token manquant' };

  try {
    const records = await base('AUTH_ACCESS_TOKEN').select({
      filterByFormula: `{token} = '${token}'`,
      maxRecords: 1,
    }).firstPage();

    if (!records || records.length === 0) {
      return { valid: false, reason: 'Token introuvable' };
    }

    const rec = records[0];
    const expiresAt = rec.get('expires_at') as string | undefined;
    const userRef = (rec.get('user') as string[] | undefined)?.[0];

    if (expiresAt) {
      const expiresDate = new Date(expiresAt);
      if (expiresDate < new Date()) {
        return { valid: false, reason: 'Token expiré' };
      }
    }

    return { valid: true, userId: userRef, recordId: rec.id };
  } catch (err) {
    console.error('verifyAccessToken error:', err);
    return { valid: false, reason: 'Erreur serveur' };
  }
}

/**
 * Extraire le token de la requête : header Authorization (Bearer), body.accessToken ou query.accessToken
 */
function extractTokenFromReq(req: NextApiRequest): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;

  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  if (req.body && typeof req.body.accessToken === 'string') return req.body.accessToken;
  if (req.query && typeof req.query.accessToken === 'string') return req.query.accessToken;

  return null;
}

/**
 * Utilitaire à appeler depuis une route API Next.js :
 * - vérifie le token, envoie 403 si invalide et retourne null
 * - sinon retourne l'userId (string)
 */
export async function requireValidAccessToken(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const token = extractTokenFromReq(req);

  if (!token) {
    res.status(403).json({ message: 'Access token manquant' });
    return null;
  }

  const result = await verifyAccessToken(token);

  if (!result.valid) {
    // Si la raison est une erreur serveur, renvoyer 500 ; sinon 403 comme demandé
    if (result.reason === 'Erreur serveur') {
      res.status(500).json({ message: 'Erreur serveur lors de la vérification du token' });
      return null;
    }

    res.status(403).json({ message: result.reason || 'Access token invalide' });
    return null;
  }

  return result.userId ?? null;
}

/**
 * Wrapper pour protéger facilement des handlers API :
 * withAuth(handler) — vérifie le token, injecte `req.body.userId` si valide, appelle handler sinon renvoie 403.
 */
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const userId = await requireValidAccessToken(req, res);

    if (!userId) return; // requireValidAccessToken a déjà répondu (403/500)

    // injecte l'id utilisateur pour le handler downstream
    try {
      if (!req.body) req.body = {} as any;
      (req.body as any).userId = userId;
    } catch (e) {
      // silent
    }

    return handler(req, res);
  };
}
