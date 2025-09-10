// Script de test pour l'API data
const testDataAPI = async () => {
  try {
    // Test avec une date et ville d'exemple
    const testDate = '12-2024'; // Décembre 2024
    const testVille = 'paris'; // Ville de test
    
    console.log(`Test de l'API data avec ville=${testVille}&date=${testDate}`);
    
    const response = await fetch(`http://localhost:3000/api/data/data?ville=${testVille}&date=${testDate}`);
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Données reçues:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Erreur:', error);
    }
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
};

// Exécuter le test
testDataAPI();
