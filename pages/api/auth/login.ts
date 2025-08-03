// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const records = await base('COLLABORATEURS')
      .select({
        filterByFormula: `{Email EPICU} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(401).json({ message: 'Compte introuvable' });
    }

    const user = records[0];
    const hashedPassword = user.get('password') as string;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    return res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.get('email'),
        name: user.get('name') || null,
      },
    });
  } catch (error) {
    console.error('Erreur de login :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
