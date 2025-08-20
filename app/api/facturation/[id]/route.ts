import { NextResponse } from 'next/server';
import { mockInvoices, type Invoice } from '../data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const invoice = mockInvoices.find(i => i.id === invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const body = await request.json();
    
    const invoiceIndex = mockInvoices.findIndex(i => i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la facture
    const updatedInvoice = {
      ...mockInvoices[invoiceIndex],
      ...body,
      id: invoiceId // Garder l'ID original
    };

    // Dans un vrai projet, on mettrait à jour en base de données
    mockInvoices[invoiceIndex] = updatedInvoice;

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Erreur lors de la modification de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const invoiceIndex = mockInvoices.findIndex(i => i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Dans un vrai projet, on supprimerait de la base de données
    mockInvoices.splice(invoiceIndex, 1);

    return NextResponse.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 