import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from './constants';
import { requireValidAccessToken } from '../../utils/verifyAccessToken';

const TABLE_NAME = 'TICKETS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Vérification de l'authentification
    const userId = await requireValidAccessToken(req, res);
    if (!userId) return; // requireValidAccessToken a déjà répondu

    const { 'Description du problème': description, 'Ville EPICU': villeEpicuClient, 'Statut': statut} = req.body || {};

    // Validation des champs requis
    if (!description) {
      return res.status(400).json({
        error: 'Le champ "Description du problème" est requis'
      });
    }

    // La ville EPICU est maintenant fournie directement par le client depuis le contexte utilisateur

    // Créer le ticket dans Airtable
    const ticketData = {
      'Description du problème': description,
      'Ville EPICU': villeEpicuClient || '', // Utiliser la ville fournie par le client
      'Statut': statut || 'Nouveau',
    };
    
    console.log('Données du ticket à envoyer:', ticketData);

    const createdRecord = await base(TABLE_NAME).create([{
      fields: ticketData
    }]);

    return res.status(201).json({
      success: true,
      message: 'Ticket créé avec succès',
      ticketId: createdRecord[0].id,
      data: {
        description: ticketData['Description du problème'],
        villeEpicu: ticketData['Ville EPICU'],
        statut: ticketData['Statut'],
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la création du ticket:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création du ticket',
      details: error?.message || String(error)
    });
  }
}
