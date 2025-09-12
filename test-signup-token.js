// Script de test pour créer un token de signup
const Airtable = require('airtable');
const crypto = require('crypto');

// Configuration Airtable (remplacez par vos vraies valeurs)
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

function generateToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

async function createSignupToken(userId) {
  try {
    const token = generateToken(32);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 heures

    // Créer le token de signup
    const record = await base('SIGNUP_TOKENS').create([
      {
        fields: {
          user_id: userId,
          token: token,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      },
    ]);

    console.log('Token de signup créé :');
    console.log('Token:', token);
    console.log('URL de test:', `http://localhost:3000/signup?q=${token}`);
    console.log('Expire le:', expiresAt.toISOString());

    return token;
  } catch (error) {
    console.error('Erreur lors de la création du token :', error);
  }
}

// Remplacer par un ID d'utilisateur valide de votre base COLLABORATEURS
const userId = 'YOUR_USER_ID_HERE';

if (userId === 'YOUR_USER_ID_HERE') {
  console.log('Veuillez remplacer YOUR_USER_ID_HERE par un ID d\'utilisateur valide');
  console.log('Vous pouvez trouver les IDs dans votre base Airtable COLLABORATEURS');
} else {
  createSignupToken(userId);
}
