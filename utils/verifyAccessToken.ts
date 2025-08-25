import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../pages/api/constants';

export async function requireValidAccessToken(
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token d\'accès requis' });
    return null;
  }

  const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Vérifier le token dans la base de données
    const records = await base('AUTH_ACCESS_TOKEN')
      .select({
        filterByFormula: `{token} = '${accessToken}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      res.status(401).json({ message: 'Token d\'accès invalide' });
      return null;
    }

    const record = records[0];
    const expiresAt = record.get('expires_at') as string;
    const userId = (record.get('user') as string[])?.[0];

    if (!userId) {
      res.status(401).json({ message: 'Token d\'accès invalide' });
      return null;
    }

    // Vérifier si le token n'est pas expiré
    if (new Date(expiresAt) < new Date()) {
      res.status(401).json({ message: 'Token d\'accès expiré' });
      return null;
    }

    return userId;
  } catch (error) {
    console.error('Erreur lors de la vérification du token :', error);
    res.status(500).json({ message: 'Erreur serveur' });
    return null;
  }
}
