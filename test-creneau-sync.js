/**
 * Script de test pour vérifier la synchronisation des créneaux de publication
 * 
 * Ce script teste le flux complet :
 * 1. Création d'un événement de publication avec sélection de créneau
 * 2. Vérification que l'ID du créneau est stocké dans l'événement
 * 3. Suppression de l'événement et vérification que le créneau est libéré
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testCreneauSync() {
  console.log('🧪 Test de synchronisation des créneaux de publication');
  console.log('====================================================');

  try {
    // 1. Récupérer un créneau libre pour le test
    console.log('\n1️⃣ Récupération d\'un créneau libre...');
    
    const creneauxResponse = await fetch(`${BASE_URL}/api/publications/creneaux?start=2024-01-01&limit=10`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!creneauxResponse.ok) {
      throw new Error(`Erreur lors de la récupération des créneaux: ${creneauxResponse.status}`);
    }

    const creneauxData = await creneauxResponse.json();
    const freeCreneau = creneauxData.results.find(c => 
      c.STATUT_DE_PUBLICATION && c.STATUT_DE_PUBLICATION.includes('recfExTXxcNivX1i4')
    );

    if (!freeCreneau) {
      console.log('⚠️ Aucun créneau libre trouvé pour le test');
      return;
    }

    console.log('✅ Créneau libre trouvé:', freeCreneau.id, freeCreneau.CATEGORIE, freeCreneau.DATE);

    // 2. Créer un événement de publication avec ce créneau
    console.log('\n2️⃣ Création d\'un événement de publication...');
    
    const publicationEvent = {
      title: 'Test Publication - Synchronisation Créneau',
      type: 'publication',
      date: freeCreneau.DATE,
      startTime: '14:00',
      endTime: '15:00',
      description: 'Test de synchronisation des créneaux',
      category: 'siege',
      'Creneau': [freeCreneau.id], // Champ de liaison (array)
      googleEventId: 'test-google-event-123', // ID Google Calendar de test
    };

    const createResponse = await fetch(`${BASE_URL}/api/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
      body: JSON.stringify(publicationEvent),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Erreur lors de la création: ${createResponse.status} - ${errorText}`);
    }

    const createdEvent = await createResponse.json();
    console.log('✅ Événement de publication créé:', createdEvent.id);

    // 3. Vérifier que l'événement a bien l'ID du créneau
    console.log('\n3️⃣ Vérification de l\'ID du créneau stocké...');
    
    const getResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Erreur lors de la récupération: ${getResponse.status}`);
    }

    const eventDetails = await getResponse.json();
    
    if (eventDetails.creneauId) {
      console.log('✅ ID du créneau trouvé dans l\'événement:', eventDetails.creneauId);
    } else {
      console.log('❌ ID du créneau manquant dans l\'événement');
    }

    // 4. Vérifier que le créneau est maintenant indisponible
    console.log('\n4️⃣ Vérification du statut du créneau...');
    
    const creneauCheckResponse = await fetch(`${BASE_URL}/api/publications/creneaux?id=${freeCreneau.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (creneauCheckResponse.ok) {
      const creneauDetails = await creneauCheckResponse.json();
      console.log('📊 Statut actuel du créneau:', creneauDetails.STATUT_DE_PUBLICATION);
    }

    // 5. Supprimer l'événement et vérifier que le créneau est libéré
    console.log('\n5️⃣ Suppression de l\'événement et libération du créneau...');
    
    const deleteResponse = await fetch(`${BASE_URL}/api/agenda?id=${createdEvent.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Erreur lors de la suppression: ${deleteResponse.status}`);
    }

    console.log('✅ Événement supprimé');

    // 6. Vérifier que le créneau est maintenant libre
    console.log('\n6️⃣ Vérification que le créneau est libéré...');
    
    const finalCreneauCheckResponse = await fetch(`${BASE_URL}/api/publications/creneaux?id=${freeCreneau.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Remplacer par un token valide
      },
    });

    if (finalCreneauCheckResponse.ok) {
      const finalCreneauDetails = await finalCreneauCheckResponse.json();
      const isFree = finalCreneauDetails.STATUT_DE_PUBLICATION && 
                     finalCreneauDetails.STATUT_DE_PUBLICATION.includes('recfExTXxcNivX1i4');
      
      if (isFree) {
        console.log('✅ Créneau libéré avec succès - Statut: 🟩 Libre');
      } else {
        console.log('❌ Créneau non libéré - Statut:', finalCreneauDetails.STATUT_DE_PUBLICATION);
      }
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
3. Exécutez le script avec : node test-creneau-sync.js

Le script testera :
- Récupération d'un créneau libre
- Création d'événement de publication avec ID de créneau
- Stockage de l'ID du créneau dans l'événement
- Suppression de l'événement
- Libération automatique du créneau (🟩 Libre)
`);

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testCreneauSync();
}

module.exports = { testCreneauSync };
