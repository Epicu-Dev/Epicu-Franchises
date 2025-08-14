import { NextResponse } from 'next/server';

interface Event {
  id: string;
  title: string;
  type: 'rendez-vous' | 'tournage' | 'publication' | 'evenement';
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  category: 'siege' | 'franchises' | 'prestataires';
}

// Données mock pour les événements
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Réunion équipe marketing',
    type: 'rendez-vous',
    date: '2025-06-15',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Salle de réunion A',
    description: 'Réunion hebdomadaire pour planifier les campagnes marketing',
    category: 'siege'
  },
  {
    id: '2',
    title: 'Tournage vidéo produit',
    type: 'tournage',
    date: '2025-06-22',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Studio photo',
    description: 'Tournage de la vidéo de présentation du nouveau produit',
    category: 'siege'
  },
  {
    id: '3',
    title: 'Publication réseaux sociaux',
    type: 'publication',
    date: '2025-06-24',
    startTime: '12:00',
    endTime: '13:00',
    description: 'Publication du contenu de la semaine sur Instagram et Facebook',
    category: 'siege'
  },
  {
    id: '4',
    title: 'Formation nouveaux employés',
    type: 'evenement',
    date: '2025-06-18',
    startTime: '10:00',
    endTime: '16:00',
    location: 'Salle de formation',
    description: 'Formation d\'intégration pour les nouveaux employés',
    category: 'siege'
  },
  {
    id: '5',
    title: 'Rendez-vous client',
    type: 'rendez-vous',
    date: '2025-06-23',
    startTime: '15:00',
    endTime: '16:00',
    location: 'Bureau client',
    description: 'Présentation des services à un nouveau client',
    category: 'franchises'
  },
  {
    id: '6',
    title: 'Publication newsletter',
    type: 'publication',
    date: '2025-06-12',
    startTime: '08:00',
    endTime: '09:00',
    description: 'Envoi de la newsletter mensuelle aux abonnés',
    category: 'siege'
  },
  {
    id: '7',
    title: 'Tournage interview',
    type: 'tournage',
    date: '2025-06-25',
    startTime: '11:00',
    endTime: '12:30',
    location: 'Studio d\'enregistrement',
    description: 'Interview du CEO pour la chaîne YouTube',
    category: 'siege'
  },
  {
    id: '8',
    title: 'Réunion franchise',
    type: 'rendez-vous',
    date: '2025-06-26',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Salle de conférence',
    description: 'Réunion avec les franchisés pour discuter des nouvelles directives',
    category: 'franchises'
  },
  {
    id: '9',
    title: 'Événement lancement',
    type: 'evenement',
    date: '2025-06-28',
    startTime: '18:00',
    endTime: '21:00',
    location: 'Espace événementiel',
    description: 'Lancement officiel du nouveau service',
    category: 'siege'
  },
  {
    id: '10',
    title: 'Rendez-vous prestataire',
    type: 'rendez-vous',
    date: '2025-06-30',
    startTime: '10:00',
    endTime: '11:00',
    location: 'Café du centre',
    description: 'Rencontre avec un nouveau prestataire de services',
    category: 'prestataires'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '6');
    const year = parseInt(searchParams.get('year') || '2025');
    const view = searchParams.get('view') || 'tout';
    const category = searchParams.get('category') || 'tout';

    // Filtrer les événements par mois et année
    let filteredEvents = mockEvents.filter(event => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth() + 1;
      const eventYear = eventDate.getFullYear();
      
      const matchesDate = eventMonth === month && eventYear === year;
      const matchesCategory = category === 'tout' || event.category === category;
      
      return matchesDate && matchesCategory;
    });

    // Trier les événements par date et heure
    filteredEvents.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`);
      const dateB = new Date(`${b.date} ${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      events: filteredEvents,
      total: filteredEvents.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
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
    if (!body.title || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Titre, date, heure de début et heure de fin sont requis' },
        { status: 400 }
      );
    }

    // Créer un nouvel événement
    const newEvent: Event = {
      id: (mockEvents.length + 1).toString(),
      title: body.title,
      type: body.type || 'rendez-vous',
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location || '',
      description: body.description || '',
      category: body.category || 'siege'
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockEvents.push(newEvent);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 