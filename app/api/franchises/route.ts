import { NextResponse } from 'next/server';
import Airtable, { Record as AirtableRecord } from 'airtable';
// Si besoin : installer les types avec npm install --save-dev @types/airtable

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export async function GET() {

    try {
        const records = await base('COLLABORATEURS').select({ view: 'Administratif des Franchisés' }).all();
        return NextResponse.json(records);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la récupération des franchises', details: String(error) }, { status: 500 });
    }
} 