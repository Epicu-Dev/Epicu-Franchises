/**
 * Script pour vérifier que le champ "Google Event ID" existe dans Airtable
 * et pour l'ajouter si nécessaire
 */

const Airtable = require('airtable');

// Configuration Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function checkGoogleEventIdField() {
  console.log('🔍 Vérification du champ "Google Event ID" dans Airtable');
  console.log('=======================================================');

  try {
    // Récupérer les métadonnées de la table AGENDA
    const table = base('AGENDA');
    
    // Essayer de récupérer un enregistrement pour voir les champs disponibles
    const records = await table.select({
      maxRecords: 1,
      fields: ['Tâche', 'Date', 'Type', 'Description', 'Google Event ID']
    }).firstPage();

    console.log('✅ Connexion à Airtable réussie');
    
    if (records.length > 0) {
      const record = records[0];
      const fields = Object.keys(record.fields);
      
      console.log('\n📋 Champs disponibles dans la table AGENDA:');
      fields.forEach(field => {
        console.log(`  - ${field}`);
      });
      
      if (fields.includes('Google Event ID')) {
        console.log('\n✅ Le champ "Google Event ID" existe déjà !');
      } else {
        console.log('\n❌ Le champ "Google Event ID" n\'existe pas');
        console.log('\n📝 Pour ajouter le champ :');
        console.log('1. Ouvrez votre base Airtable');
        console.log('2. Allez dans la table "AGENDA"');
        console.log('3. Cliquez sur "Add a field"');
        console.log('4. Nommez le champ "Google Event ID"');
        console.log('5. Sélectionnez le type "Single line text"');
        console.log('6. Sauvegardez');
      }
    } else {
      console.log('⚠️ Aucun enregistrement trouvé dans la table AGENDA');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    
    if (error.message.includes('Could not find table')) {
      console.log('\n💡 Vérifiez que :');
      console.log('- La variable AIRTABLE_BASE_ID est correcte');
      console.log('- La table "AGENDA" existe dans votre base');
    } else if (error.message.includes('Could not find field')) {
      console.log('\n💡 Le champ "Google Event ID" n\'existe pas dans Airtable');
      console.log('Ajoutez-le manuellement dans l\'interface Airtable');
    } else if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Vérifiez que la variable AIRTABLE_API_KEY est correcte');
    }
  }
}

// Instructions d'utilisation
console.log(`
📋 Instructions pour utiliser ce script :

1. Assurez-vous d'avoir les variables d'environnement :
   - AIRTABLE_API_KEY
   - AIRTABLE_BASE_ID

2. Installez Airtable si nécessaire :
   npm install airtable

3. Exécutez le script :
   node check-airtable-field.js

Le script vérifiera si le champ "Google Event ID" existe dans votre table AGENDA.
`);

// Exécuter la vérification si le script est appelé directement
if (require.main === module) {
  checkGoogleEventIdField();
}

module.exports = { checkGoogleEventIdField };
