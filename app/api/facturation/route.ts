import { NextResponse } from 'next/server';
import { mockInvoices, type Invoice } from './data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'en_attente';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'establishmentName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filtrer les factures
    let filteredInvoices = mockInvoices.filter(invoice => {
      const matchesStatus = status === 'tous' || invoice.status === status;
      const matchesSearch = !search || 
        invoice.establishmentName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.serviceType.toLowerCase().includes(search.toLowerCase()) ||
        invoice.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || category === 'tous' || invoice.category === category;
      
      return matchesStatus && matchesSearch && matchesCategory;
    });

    // Trier les factures
    filteredInvoices.sort((a, b) => {
      const aValue = a[sortBy as keyof Invoice];
      const bValue = b[sortBy as keyof Invoice];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    return NextResponse.json({
      invoices: paginatedInvoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredInvoices.length / limit),
        totalItems: filteredInvoices.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.establishmentName || !body.date || !body.amount || !body.serviceType) {
      return NextResponse.json(
        { error: 'Nom de l\'établissement, date, montant et type de prestation sont requis' },
        { status: 400 }
      );
    }

    // Créer une nouvelle facture
    const newInvoice: Invoice = {
      id: (mockInvoices.length + 1).toString(),
      category: body.category || 'Shop',
      establishmentName: body.establishmentName,
      date: body.date,
      amount: body.amount,
      serviceType: body.serviceType,
      status: body.status || 'en_attente',
      comment: body.comment || ''
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    mockInvoices.push(newInvoice);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 