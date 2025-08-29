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
    const collaboratorId = body.collaboratorId as string | undefined;
    const nomComplet = body.nomComplet as string | undefined;

    if (!collaboratorId && !nomComplet) {
      return res.status(400).json({ error: 'collaboratorId or nomComplet required' });
    }

    let recordId = collaboratorId;

    // If nomComplet provided, try to find the record
    if (!recordId && nomComplet) {
      const escaped = String(nomComplet).replace(/"/g, '\\"');
      const records = await base(TABLE_NAME)
        .select({ filterByFormula: `({Nom complet} = "${escaped}")`, maxRecords: 1, fields: ['Nom complet'] })
        .firstPage();

      if (!records || records.length === 0) {
        return res.status(404).json({ error: 'Collaborateur non trouvé' });
      }

      recordId = records[0].id;
    }

    // generate a secure random token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +1 week

    // Update collaborator record with token and expiry
    const fieldsToUpdate: any = {
      token_config: token,
      token_config_expires_at: expiresAt,
    };

    await base(TABLE_NAME).update([{ id: recordId as string, fields: fieldsToUpdate }]);

    return res.status(200).json({ id: recordId, token, expiresAt });
  } catch (error: any) {
    console.error('config_token error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur interne', details: error?.message || String(error) });
  }
}
