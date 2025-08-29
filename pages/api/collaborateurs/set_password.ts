import type { NextApiRequest, NextApiResponse } from 'next';

import bcrypt from 'bcrypt';

import { base } from '../constants';

const COLLAB_TABLE = 'COLLABORATEURS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, password } = req.body || {};

    if (!token || !password) return res.status(400).json({ error: 'token and password required' });

    const tokenEscaped = String(token).replace(/'/g, "\\'");

    const records = await base(COLLAB_TABLE)
      .select({ filterByFormula: `{token_config} = '${tokenEscaped}'`, maxRecords: 1 })
      .firstPage();

    if (!records || records.length === 0) return res.status(401).json({ error: 'Invalid token' });

    const userRecord = records[0];
    const expiresAt = userRecord.get('token_config_expires_at') as string | undefined;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashed = await bcrypt.hash(String(password), saltRounds);

    // Update user record: store password and clear token fields
    const fieldsToUpdate: any = {
      password: hashed,
      // optionally clear token so it can't be reused
      token_config: null,
      token_config_expires_at: null,
    };

    await base(COLLAB_TABLE).update([{ id: userRecord.id, fields: fieldsToUpdate }]);

    return res.status(200).json({ id: userRecord.id, message: 'Password set' });
  } catch (error: any) {
    console.error('set_password error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
