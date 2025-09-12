// Script de test pour vérifier que le rôle est bien pris en compte
const fetch = require('node-fetch');

async function testRoleFix() {
  try {
    // Remplacez par un token d'accès valide
    const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

    console.log('Test de création d\'un collaborateur avec un rôle...');

    // Test POST avec rôle
    const postData = {
      nom: 'Test',
      prenom: 'Role',
      role: 'Studio',
      emailPerso: 'test.role@example.com',
      telephone: '0123456789'
    };

    const postResponse = await fetch('http://localhost:3000/api/equipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(postData)
    });

    const postResult = await postResponse.json();

    if (postResponse.ok) {
      console.log('✅ POST réussi - Collaborateur créé avec le rôle:', postResult.fields['Rôle']);
      
      // Test PATCH pour modifier le rôle
      const patchData = {
        role: 'Photographe/Vidéaste'
      };

      const patchResponse = await fetch(`http://localhost:3000/api/equipe?id=${postResult.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(patchData)
      });

      const patchResult = await patchResponse.json();

      if (patchResponse.ok) {
        console.log('✅ PATCH réussi - Rôle modifié vers:', patchResult.fields['Rôle']);
      } else {
        console.error('❌ PATCH échoué:', patchResult.error);
      }
    } else {
      console.error('❌ POST échoué:', postResult.error);
    }
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

if (process.argv[2] === 'YOUR_ACCESS_TOKEN_HERE') {
  console.log('Veuillez remplacer YOUR_ACCESS_TOKEN_HERE par un token d\'accès valide');
  console.log('Usage: node test-role-fix.js <accessToken>');
} else {
  testRoleFix();
}
