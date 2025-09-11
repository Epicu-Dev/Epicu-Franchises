import { NextResponse } from 'next/server';

import { base } from '../../../pages/api/constants';

export async function GET() {
  try {
    // Appel simple à Airtable pour préchauffer la connexion
    // On fait un appel minimal qui récupère juste 1 enregistrement pour établir la connexion
    await base('COLLABORATEURS')
      .select({
        maxRecords: 1,
        view: 'Administratif des Franchisés'
      })
      .firstPage();

    return NextResponse.json({ 
      success: true, 
      message: 'Airtable connection warmed up',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors du préchauffage Airtable:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du préchauffage Airtable',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
