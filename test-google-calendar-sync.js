/**
 * Script de test pour vérifier la synchronisation Google Calendar
 * 
 * Ce script teste le flux complet :
 * 1. Création d'un événement EPICU (qui devrait créer dans Airtable + Google Calendar)
 * 2. Vérification que l'ID Google Calendar est stocké dans Airtable
 * 3. Suppression de l'événement (qui devrait supprimer des deux côtés)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testGoogleCalendarSync() {
  console.log('🧪 Test de synchronisation Google Calendar');
  console.log('==========================================');

  try {
    // 1. Créer un événement de test
    console.log('\n1️⃣ Création d\'un événement de test...');
    
    const eventData = {
      title: 'Test Synchronisation Google Calendar',
      type: 'evenement',
      date: new Date().toISOString(),
      startTime: '14:00',
      endTime: '15:00',
      description: 'Événement de test pour vérifier la synchronisation',
      category: 'siege',
      collaborator: 'test-user-id', // Remplacer par un ID valide
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
      throw new Error(`Erreur lors de la création: ${createResponse.status}`);
    }

    const createdEvent = await createResponse.json();
    console.log('✅ Événement créé:', createdEvent.id);

    // 2. Vérifier que l'événement a un googleEventId
    console.log('\n2️⃣ Vérification de l\'ID Google Calendar...');
    
    const getResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Erreur lors de la récupération: ${getResponse.status}`);
    }

    const eventDetails = await getResponse.json();
    
    if (eventDetails.googleEventId) {
      console.log('✅ ID Google Calendar trouvé:', eventDetails.googleEventId);
    } else {
      console.log('⚠️ Aucun ID Google Calendar trouvé - vérifiez la connexion Google Calendar');
    }

    // 3. Supprimer l'événement
    console.log('\n3️⃣ Suppression de l\'événement...');
    
    const deleteResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Erreur lors de la suppression: ${deleteResponse.status}`);
    }

    console.log('✅ Événement supprimé avec succès');
    console.log('\n🎉 Test terminé - Vérifiez que l\'événement a été supprimé de Google Calendar');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Instructions d'utilisation
console.log(`
📋 Instructions pour utiliser ce script :

1. Assurez-vous que votre serveur Next.js est démarré
2. Remplacez 'YOUR_ACCESS_TOKEN' par un token d'accès valide
3. Remplacez 'test-user-id' par un ID de collaborateur valide
4. Exécutez le script avec : node test-google-calendar-sync.js

Le script testera :
- Création d'événement avec synchronisation Google Calendar
- Stockage de l'ID Google Calendar dans Airtable
- Suppression bidirectionnelle (Airtable + Google Calendar)
`);

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testGoogleCalendarSync();
}

module.exports = { testGoogleCalendarSync };
