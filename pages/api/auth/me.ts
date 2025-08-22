import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const userId = await requireValidAccessToken(req, res);

    if (!userId) return; // requireValidAccessToken a déjà répondu

    // Récupérer le record collaborateur
    const record = await base('COLLABORATEURS').find(userId);

    if (!record) {
      return res.status(404).json({ message: 'Collaborateur introuvable' });
    }

    const fields = record.fields || {};

    return res.status(200).json({
      id: record.id,
      ...fields,
    });
  } catch (error) {
    console.error('Erreur /api/auth/me :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
