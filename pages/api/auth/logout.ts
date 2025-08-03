// /pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { accessToken, refreshToken } = req.body;

  if (!accessToken || !refreshToken) {
    return res.status(400).json({ message: 'Tokens manquants' });
  }

  try {
    const deleteRecordsByToken = async (tableName: string, token: string) => {
      const records = await base(tableName)
        .select({
          filterByFormula: `{token} = '${token}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length > 0) {
        await base(tableName).destroy(records[0].id);
      }
    };

    await deleteRecordsByToken('AUTH_ACCESS_TOKEN', accessToken);
    await deleteRecordsByToken('AUTH_REFRESH_TOKEN', refreshToken);

    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur de déconnexion :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
