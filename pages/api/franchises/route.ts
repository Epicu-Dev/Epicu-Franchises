import { NextResponse } from 'next/server';
import { base } from "../constants";
// Si besoin : installer les types avec npm install --save-dev @types/airtable

export async function GET() {

    try {
        const records = await base('COLLABORATEURS').select({ view: 'Administratif des Franchisés' }).all();
        return NextResponse.json(records);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la récupération des franchises', details: String(error) }, { status: 500 });
    }
} 