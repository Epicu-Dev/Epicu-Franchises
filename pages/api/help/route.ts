import { NextResponse } from 'next/server';

interface HelpRequest {
  objet: string;
  commentaires: string;
  expediteur: string;
  destinataire: string;
}

export async function POST(request: Request) {
  try {
    const body: HelpRequest = await request.json();
    
    // Validation des données
    if (!body.objet || !body.expediteur || !body.destinataire) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Préparer le contenu de l'email
    const emailContent = {
      from: body.expediteur,
      to: body.destinataire,
      subject: `[DEMANDE D'AIDE] ${body.objet}`,
      text: `
Nouvelle demande d'aide reçue :

Objet: ${body.objet}
Expéditeur: ${body.expediteur}
Commentaires: ${body.commentaires || 'Aucun commentaire'}

Date: ${new Date().toLocaleString('fr-FR')}
      `,
      html: `
        <h2>Nouvelle demande d'aide reçue</h2>
        <p><strong>Objet:</strong> ${body.objet}</p>
        <p><strong>Expéditeur:</strong> ${body.expediteur}</p>
        <p><strong>Commentaires:</strong> ${body.commentaires || 'Aucun commentaire'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      `
    };

    // TODO: Implémenter l'envoi d'email réel
    // Pour l'instant, on simule l'envoi
    console.log('Email à envoyer:', emailContent);
    
    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ 
      message: 'Demande d\'aide envoyée avec succès',
      emailSent: true,
      to: body.destinataire,
      from: body.expediteur
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'aide:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 