import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const COLLAB_TABLE = 'COLLABORATEURS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body || {};

    if (!token) return res.status(400).json({ error: 'token required' });

    const tokenEscaped = String(token).replace(/'/g, "\\'");

    const records = await base(COLLAB_TABLE)
      .select({ filterByFormula: `{token_config} = '${tokenEscaped}'`, maxRecords: 1 })
      .firstPage();

    if (!records || records.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userRecord = records[0];

    const expiresAt = userRecord.get('token_config_expires_at') as string | undefined;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Resolve linked villes epicu
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
      // ignore ville fetch errors
    }

    return res.status(200).json({
      id: userRecord.id,
      nom: userRecord.get('Nom'),
      prenom: userRecord.get('Prénom'),
      email: userRecord.get('Email EPICU'),
      villes: villesEpicu,
    });
  } catch (error: any) {
    console.error('validate_token error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
