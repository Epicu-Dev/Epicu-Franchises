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

    // Récupérer le record collaborateur avec les champs explicites
    const record = await base('COLLABORATEURS').find(userId);

    if (!record) {
      return res.status(404).json({ message: 'Collaborateur introuvable' });
    }

    // Récupérer explicitement les champs nécessaires
    const fields = {
      'Nom': record.get('Nom') || '',
      'Prénom': record.get('Prénom') || '',
      'Email perso': record.get('Email perso') || '',
      'Email EPICU': record.get('Email EPICU') || '',
      'Rôle': record.get('Rôle') || '',
      'Téléphone': record.get('Téléphone') || '',
      'Identifiant': record.get('Identifiant') || '',
      'Trombi': record.get('Trombi') || null,
      'Ville EPICU': record.get('Ville EPICU') || []
    };


    // Récupérer les villes liées à l'utilisateur
    let villesEpicu: { id: string; ville: string }[] = [];

    try {
      const linked = fields['Ville EPICU'];
      let linkedIds: string[] = [];

      if (linked) {
        if (Array.isArray(linked)) linkedIds = linked;
        else if (typeof linked === 'string') linkedIds = [linked];
      }
      if (linkedIds.length > 0) {
        const v = await base('VILLES EPICU')
          .select({ 
            filterByFormula: `OR(${linkedIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`, 
            fields: ['Ville EPICU'], 
            maxRecords: linkedIds.length 
          })
          .all();

        villesEpicu = v.map((r: any) => ({ id: r.id, ville: r.get('Ville EPICU') }));
      }
    } catch (e) {
      console.error('Erreur lors de la récupération des villes:', e);
      // ignore failures to fetch villes
    }

    // Ajouter des headers pour éviter le cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      id: record.id,
      ...fields,
      telephone: fields['Téléphone'] || '', // S'assurer que le téléphone est explicitement récupéré
      'Téléphone': fields['Téléphone'] || '', // Garder aussi la clé avec accent pour compatibilité
      'Email EPICU': fields['Email EPICU'] || '', // S'assurer que l'email EPICU est explicitement récupéré
      villes: villesEpicu, // Ajouter les villes résolues
    });
  } catch (error) {
    console.error('Erreur /api/auth/me :', error);

    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
