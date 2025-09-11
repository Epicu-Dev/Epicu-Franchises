// Script de test pour vérifier la synchronisation du calendrier EPICU
// Ce script teste l'API de synchronisation pour s'assurer qu'elle filtre correctement par calendrier EPICU

const testEpicuSync = async () => {
  try {
    console.log('🔄 Test de la synchronisation du calendrier EPICU...');
    
    // Test de l'API de statut pour récupérer les calendriers
    console.log('\n1. Vérification du statut de connexion...');
    const statusResponse = await fetch('http://localhost:3000/api/google-calendar/status');
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Connexion Google Calendar:', status.isConnected ? 'Connecté' : 'Non connecté');
      
      if (status.calendars && status.calendars.length > 0) {
        console.log('📅 Calendriers disponibles:');
        status.calendars.forEach(cal => {
          const isEpicu = cal.summary?.toLowerCase().includes('epicu');
          console.log(`  - ${cal.summary} ${isEpicu ? '🎯 (EPICU)' : ''}`);
        });
        
        const epicuCalendars = status.calendars.filter(cal => 
          cal.summary?.toLowerCase().includes('epicu')
        );
        
        if (epicuCalendars.length > 0) {
          console.log(`\n✅ ${epicuCalendars.length} calendrier(s) EPICU trouvé(s)`);
        } else {
          console.log('\n⚠️  Aucun calendrier contenant "EPICU" trouvé');
        }
      }
    } else {
      console.log('❌ Erreur lors de la vérification du statut');
    }
    
    // Test de l'API de synchronisation
    console.log('\n2. Test de la synchronisation...');
    const syncResponse = await fetch('http://localhost:3000/api/google-calendar/sync');
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ Synchronisation réussie');
      console.log(`📊 Événements synchronisés: ${syncData.events?.length || 0}`);
      
      if (syncData.message) {
        console.log(`💬 Message: ${syncData.message}`);
      }
      
      if (syncData.events && syncData.events.length > 0) {
        console.log('\n📋 Événements trouvés:');
        syncData.events.slice(0, 5).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.summary} (${event.start?.dateTime || event.start?.date})`);
        });
        
        if (syncData.events.length > 5) {
          console.log(`  ... et ${syncData.events.length - 5} autres événements`);
        }
      }
    } else {
      const errorData = await syncResponse.json();
      console.log('❌ Erreur lors de la synchronisation:', errorData.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
};

// Exécuter le test si le script est appelé directement
if (typeof window === 'undefined') {
  testEpicuSync();
}

module.exports = { testEpicuSync };
