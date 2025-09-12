import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'COLLABORATEURS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // require a valid access token and get the caller user id
    const callerUserId = await requireValidAccessToken(req, res);

    if (!callerUserId) return; // response already sent by requireValidAccessToken

    // ensure caller has admin role
    try {
      const callerRecord = await base(TABLE_NAME).find(callerUserId);
      const callerRole = (callerRecord.get('Rôle') || '').toString().toLowerCase();

      if (callerRole !== 'admin' && callerRole !== 'administrateur') {
        return res.status(403).json({ error: 'Forbidden: admin role required' });
      }
    } catch (e) {
      return res.status(500).json({ error: 'Unable to verify caller role' });
    }

    const body = req.body || {};
    const collaboratorId = (body.collaboratorId || body.id) as string | undefined;

    if (!collaboratorId) {
      return res.status(400).json({ error: 'collaboratorId required' });
    }

    // Fetch the collaborator by id
    let collaboratorRecord: any;
    try {
      collaboratorRecord = await base(TABLE_NAME).find(collaboratorId);
    } catch (e) {
      return res.status(404).json({ error: 'Collaborateur non trouvé' });
    }

    // Verify that Nom and Prénom are defined
    const nom = (collaboratorRecord.get('Nom') || '').toString().trim();
    const prenom = (collaboratorRecord.get('Prénom') || '').toString().trim();

    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le collaborateur doit avoir un Nom et un Prénom définis' });
    }

    // generate a secure random token and expiry
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +1 week

    // Update collaborator record with token and expiry
    const fieldsToUpdate: any = {
      token_config: token,
      token_config_expires_at: expiresAt,
    };

    try {
      await base(TABLE_NAME).update([{ id: collaboratorId, fields: fieldsToUpdate }]);
    } catch (e) {
      console.error('Unable to update collaborator with token:', e);
      return res.status(500).json({ error: 'Impossible de mettre à jour le collaborateur' });
    }

    return res.status(200).json({ id: collaboratorId, token, expiresAt });
  } catch (error: any) {
    console.error('config_token error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur interne', details: error?.message || String(error) });
  }
}
