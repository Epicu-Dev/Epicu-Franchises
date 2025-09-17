/**
 * Script de test direct de l'API pour vérifier le stockage des IDs
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testApiDirect() {
  console.log('🧪 Test direct de l\'API');
  console.log('========================');

  try {
    // 1. Créer un événement avec les deux IDs
    console.log('\n1️⃣ Création d\'un événement avec IDs...');
    
    const testEvent = {
      title: 'Test API Direct',
      type: 'publication',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      description: 'Test direct de l\'API',
      category: 'siege',
      'Creneau': ['recTestCreneau123'], // Champ de liaison
      googleEventId: 'test-google-event-456', // ID Google Calendar
    };

    console.log('📤 Données envoyées:', JSON.stringify(testEvent, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(testEvent),
    });

    console.log('📊 Statut de la réponse:', createResponse.status);
    console.log('📊 Headers de la réponse:', Object.fromEntries(createResponse.headers.entries()));

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Erreur lors de la création:', errorText);
      throw new Error(`Erreur lors de la création: ${createResponse.status} - ${errorText}`);
    }

    const createdEvent = await createResponse.json();
    console.log('✅ Événement créé:', createdEvent);
    console.log('📋 ID de l\'événement:', createdEvent.id);

    // 2. Vérifier immédiatement les données stockées
    console.log('\n2️⃣ Vérification immédiate des données...');
    
    const getResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Erreur lors de la récupération: ${getResponse.status}`);
    }

    const eventDetails = await getResponse.json();
    console.log('📋 Détails complets de l\'événement:', JSON.stringify(eventDetails, null, 2));
    
    // Vérifications spécifiques
    console.log('\n3️⃣ Vérifications spécifiques...');
    
    if (eventDetails.googleEventId) {
      console.log('✅ Google Event ID trouvé:', eventDetails.googleEventId);
    } else {
      console.log('❌ Google Event ID manquant');
    }
    
    if (eventDetails.creneauId) {
      console.log('✅ Creneau ID trouvé:', eventDetails.creneauId);
    } else {
      console.log('❌ Creneau ID manquant');
    }

    // 4. Test de mise à jour
    console.log('\n4️⃣ Test de mise à jour...');
    
    const updateData = {
      googleEventId: 'updated-google-789',
      'Creneau': ['recUpdatedCreneau456'],
    };

    console.log('📤 Données de mise à jour:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(updateData),
    });

    console.log('📊 Statut de la mise à jour:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Erreur lors de la mise à jour:', errorText);
    } else {
      const updatedEvent = await updateResponse.json();
      console.log('✅ Événement mis à jour:', updatedEvent);
    }

    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage...');
    
    const deleteResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (deleteResponse.ok) {
      console.log('✅ Événement supprimé');
    } else {
      console.log('⚠️ Impossible de supprimer l\'événement');
    }

    console.log('\n🎉 Test terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Instructions d'utilisation
console.log(`
📋 Instructions pour utiliser ce script :

1. Assurez-vous que votre serveur Next.js est démarré
2. Remplacez 'YOUR_ACCESS_TOKEN' par un token d'accès valide
3. Exécutez le script avec : node test-api-direct.js

Ce script teste directement l'API pour :
- Création d'événement avec IDs
- Vérification des données stockées
- Mise à jour des IDs
- Suppression de l'événement
`);

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testApiDirect();
}

module.exports = { testApiDirect };
