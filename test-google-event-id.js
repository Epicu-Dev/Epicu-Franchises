/**
 * Script de test pour vérifier que le champ Google Event ID est bien géré
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testGoogleEventIdField() {
  console.log('🧪 Test du champ Google Event ID');
  console.log('================================');

  try {
    // Test 1: Création d'un événement avec Google Event ID
    console.log('\n1️⃣ Test de création avec Google Event ID...');
    
    const eventData = {
      title: 'Test Google Event ID',
      type: 'evenement',
      date: new Date().toISOString(),
      startTime: '14:00',
      endTime: '15:00',
      description: 'Test du champ Google Event ID',
      category: 'siege',
      googleEventId: 'test-google-event-123', // ID de test
    };

    const createResponse = await fetch(`${BASE_URL}/api/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(eventData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Erreur lors de la création: ${createResponse.status} - ${errorText}`);
    }

    const createdEvent = await createResponse.json();
    console.log('✅ Événement créé:', createdEvent.id);
    console.log('📋 Données créées:', createdEvent);

    // Test 2: Mise à jour de l'événement avec un nouvel ID Google
    console.log('\n2️⃣ Test de mise à jour avec Google Event ID...');
    
    const updateData = {
      googleEventId: 'updated-google-event-456',
    };

    const updateResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erreur lors de la mise à jour: ${updateResponse.status} - ${errorText}`);
    }

    const updatedEvent = await updateResponse.json();
    console.log('✅ Événement mis à jour:', updatedEvent.id);
    console.log('📋 Champs mis à jour:', updatedEvent.fields);

    // Test 3: Récupération de l'événement pour vérifier
    console.log('\n3️⃣ Test de récupération pour vérifier le champ...');
    
    const getResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Erreur lors de la récupération: ${getResponse.status} - ${errorText}`);
    }

    const eventDetails = await getResponse.json();
    console.log('✅ Événement récupéré:', eventDetails);
    
    if (eventDetails.googleEventId) {
      console.log('✅ Google Event ID trouvé:', eventDetails.googleEventId);
    } else {
      console.log('❌ Google Event ID manquant dans les données récupérées');
    }

    // Nettoyage: Supprimer l'événement de test
    console.log('\n4️⃣ Nettoyage - Suppression de l\'événement de test...');
    
    const deleteResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!deleteResponse.ok) {
      console.warn('⚠️ Impossible de supprimer l\'événement de test');
    } else {
      console.log('✅ Événement de test supprimé');
    }

    console.log('\n🎉 Test terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Instructions d'utilisation
console.log(`
📋 Instructions pour utiliser ce script :

1. Assurez-vous que votre serveur Next.js est démarré
2. Remplacez 'YOUR_ACCESS_TOKEN' par un token d'accès valide
3. Exécutez le script avec : node test-google-event-id.js

Le script testera :
- Création d'événement avec googleEventId
- Mise à jour d'événement avec googleEventId
- Récupération pour vérifier que le champ est bien stocké
- Suppression de l'événement de test
`);

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testGoogleEventIdField();
}

module.exports = { testGoogleEventIdField };
