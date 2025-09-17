/**
 * Script de test pour vérifier que les IDs sont bien stockés
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testIdsStorage() {
  console.log('🧪 Test de stockage des IDs');
  console.log('===========================');

  try {
    // 1. Créer un événement de test avec Google Event ID et Creneau ID
    console.log('\n1️⃣ Création d\'un événement de test...');
    
    const testEvent = {
      title: 'Test Stockage IDs',
      type: 'publication',
      date: new Date().toISOString().split('T')[0], // Aujourd'hui
      startTime: '14:00',
      endTime: '15:00',
      description: 'Test de stockage des IDs',
      category: 'siege',
      'Creneau': ['recTestCreneau123'], // ID de créneau de test
      googleEventId: 'test-google-event-456', // ID Google Calendar de test
    };

    const createResponse = await fetch(`${BASE_URL}/api/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(testEvent),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Erreur lors de la création: ${createResponse.status} - ${errorText}`);
    }

    const createdEvent = await createResponse.json();
    console.log('✅ Événement créé:', createdEvent.id);

    // 2. Vérifier que les IDs sont bien stockés
    console.log('\n2️⃣ Vérification des IDs stockés...');
    
    const getResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Erreur lors de la récupération: ${getResponse.status}`);
    }

    const eventDetails = await getResponse.json();
    console.log('📋 Détails de l\'événement:', eventDetails);
    
    // Vérifier Google Event ID
    if (eventDetails.googleEventId) {
      console.log('✅ Google Event ID trouvé:', eventDetails.googleEventId);
    } else {
      console.log('❌ Google Event ID manquant');
    }
    
    // Vérifier Creneau ID
    if (eventDetails.creneauId) {
      console.log('✅ Creneau ID trouvé:', eventDetails.creneauId);
    } else {
      console.log('❌ Creneau ID manquant');
    }

    // 3. Tester la mise à jour des IDs
    console.log('\n3️⃣ Test de mise à jour des IDs...');
    
    const updateData = {
      googleEventId: 'updated-google-event-789',
      'Creneau': ['recUpdatedCreneau456'],
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

    // 4. Vérifier les IDs mis à jour
    console.log('\n4️⃣ Vérification des IDs mis à jour...');
    
    const finalGetResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!finalGetResponse.ok) {
      throw new Error(`Erreur lors de la récupération finale: ${finalGetResponse.status}`);
    }

    const finalEventDetails = await finalGetResponse.json();
    
    if (finalEventDetails.googleEventId === 'updated-google-event-789') {
      console.log('✅ Google Event ID mis à jour correctement');
    } else {
      console.log('❌ Google Event ID non mis à jour:', finalEventDetails.googleEventId);
    }
    
    if (finalEventDetails.creneauId === 'recUpdatedCreneau456') {
      console.log('✅ Creneau ID mis à jour correctement');
    } else {
      console.log('❌ Creneau ID non mis à jour:', finalEventDetails.creneauId);
    }

    // Nettoyage: Supprimer l'événement de test
    console.log('\n5️⃣ Nettoyage - Suppression de l\'événement de test...');
    
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
3. Exécutez le script avec : node test-ids-storage.js

Le script testera :
- Création d'événement avec Google Event ID et Creneau ID
- Vérification que les IDs sont stockés
- Mise à jour des IDs
- Vérification que les IDs sont mis à jour
- Suppression de l'événement de test
`);

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testIdsStorage();
}

module.exports = { testIdsStorage };
