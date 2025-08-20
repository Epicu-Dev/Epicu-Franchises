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

// Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();

  return today.toISOString().split('T')[0];
};

// Fonction pour obtenir une date relative à aujourd'hui
const getDateOffset = (daysOffset: number) => {
  const date = new Date();

  date.setDate(date.getDate() + daysOffset);

  return date.toISOString().split('T')[0];
};

// Fonction pour obtenir la date de demain
const getTomorrowDate = () => {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().split('T')[0];
};

// Fonction pour obtenir la date d'après-demain
const getDayAfterTomorrowDate = () => {
  const dayAfter = new Date();

  dayAfter.setDate(dayAfter.getDate() + 2);

  return dayAfter.toISOString().split('T')[0];
};

// Données mock pour les événements
const mockEvents: Event[] = [
  // Événements d'aujourd'hui
  {
    id: 'today-1',
    title: 'Réunion équipe - Point matinal',
    type: 'rendez-vous',
    date: getTodayDate(),
    startTime: '09:00',
    endTime: '10:00',
    location: 'Salle de conférence',
    description: 'Point quotidien avec l\'équipe de développement',
    category: 'siege'
  },
  {
    id: 'today-2',
    title: 'Tournage - Restaurant Le Bistrot',
    type: 'tournage',
    date: getTodayDate(),
    startTime: '11:30',
    endTime: '14:30',
    location: 'Le Bistrot, Paris 11e',
    description: 'Tournage photo et vidéo pour la catégorie FOOD',
    category: 'siege'
  },
  {
    id: 'today-3',
    title: 'RDV Prospect - Café des Arts',
    type: 'rendez-vous',
    date: getTodayDate(),
    startTime: '15:00',
    endTime: '16:00',
    location: 'Café des Arts',
    description: 'Rendez-vous de prospection pour nouveau franchisé',
    category: 'franchises'
  },
  {
    id: 'today-4',
    title: 'Publication - Gagnant du mois',
    type: 'publication',
    date: getTodayDate(),
    startTime: '17:00',
    endTime: '17:30',
    location: 'Bureau marketing',
    description: 'Publication du gagnant du concours mensuel sur les réseaux sociaux',
    category: 'siege'
  },
  {
    id: 'today-5',
    title: 'Appel prestataire photo',
    type: 'rendez-vous',
    date: getTodayDate(),
    startTime: '18:00',
    endTime: '18:30',
    location: 'Téléconférence',
    description: 'Discussion avec nouveau photographe partenaire',
    category: 'prestataires'
  },

  // Événements de demain
  {
    id: 'tomorrow-1',
    title: 'Tournage - Spa Wellness',
    type: 'tournage',
    date: getTomorrowDate(),
    startTime: '10:00',
    endTime: '13:00',
    location: 'Spa Wellness, Paris 16e',
    description: 'Séance photo pour la catégorie BEAUTY & WELLNESS',
    category: 'siege'
  },
  {
    id: 'tomorrow-2',
    title: 'RDV Client - Suivi contrat',
    type: 'rendez-vous',
    date: getTomorrowDate(),
    startTime: '14:30',
    endTime: '15:30',
    location: 'Siège Epicu',
    description: 'Point sur l\'avancement du contrat avec client existant',
    category: 'franchises'
  },
  {
    id: 'tomorrow-3',
    title: 'Publication - Story Instagram',
    type: 'publication',
    date: getTomorrowDate(),
    startTime: '16:00',
    endTime: '16:15',
    location: 'Bureau marketing',
    description: 'Publication des stories quotidiennes sur Instagram',
    category: 'siege'
  },

  // Événements d'après-demain
  {
    id: 'dayafter-1',
    title: 'Formation équipe commerciale',
    type: 'evenement',
    date: getDayAfterTomorrowDate(),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Salle de formation',
    description: 'Formation sur les nouvelles techniques de vente',
    category: 'siege'
  },
  {
    id: 'dayafter-2',
    title: 'Tournage - Boutique Mode',
    type: 'tournage',
    date: getDayAfterTomorrowDate(),
    startTime: '14:00',
    endTime: '17:00',
    location: 'Boutique Élégance, Paris 1er',
    description: 'Shooting photo pour collection automne-hiver',
    category: 'siege'
  },
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
  },


  {
    id: 'week-current-1',
    title: 'Événement Semaine Courante - RDV Client',
    type: 'rendez-vous',
    date: getDateOffset(1), // Demain
    startTime: '09:30',
    endTime: '10:30',
    location: 'Bureau commercial',
    description: 'Rendez-vous avec prospect important',
    category: 'franchises'
  },
  {
    id: 'week-current-2',
    title: 'Événement Semaine Courante - Tournage',
    type: 'tournage',
    date: getDateOffset(2), // Après-demain
    startTime: '13:00',
    endTime: '15:00',
    location: 'Restaurant partenaire',
    description: 'Tournage pour campagne marketing',
    category: 'siege'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '6');
    const year = parseInt(searchParams.get('year') || '2025');
    const day = parseInt(searchParams.get('day') || '1');
    const view = searchParams.get('view') || 'tout';
    const category = searchParams.get('category') || 'tout';

    // Filtrer les événements par mois et année
    let filteredEvents = mockEvents.filter(event => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth() + 1;
      const eventYear = eventDate.getFullYear();

      // Pour la vue semaine, inclure les événements de la semaine courante
      if (view === 'semaine') {
        // Utiliser la date sélectionnée au lieu du premier jour du mois
        const currentDate = new Date(year, month - 1, day);
        const startOfWeek = new Date(currentDate);

        // Calculer le début de la semaine (lundi)
        const dayOfWeek = currentDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Dimanche = 0, donc 6 jours en arrière

        startOfWeek.setDate(currentDate.getDate() - daysToMonday);

        const endOfWeek = new Date(startOfWeek);

        endOfWeek.setDate(startOfWeek.getDate() + 6);

        // Réinitialiser les heures pour une comparaison correcte
        startOfWeek.setHours(0, 0, 0, 0);
        endOfWeek.setHours(23, 59, 59, 999);

        const matchesWeek = eventDate >= startOfWeek && eventDate <= endOfWeek;
        const matchesCategory = category === 'tout' || event.category === category;

        return matchesWeek && matchesCategory;
      }

      // Pour la vue mois, inclure tous les événements du mois
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
    mockEvents.push(newEvent);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 