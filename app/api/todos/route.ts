import { NextResponse } from 'next/server';

interface Todo {
  id: string;
  titre: string;
  description: string;
  priorite: 'basse' | 'moyenne' | 'haute' | 'urgente';
  statut: 'a_faire' | 'en_cours' | 'terminee' | 'annulee';
  assigne: string;
  dateEcheance: string;
  dateCreation: string;
  tags: string[];
}

// Données mock pour les todos
const mockTodos: Todo[] = [
  {
    id: '1',
    titre: 'Finaliser le design de la page clients',
    description: 'Terminer la mise en page et les interactions de la page clients selon les maquettes',
    priorite: 'haute',
    statut: 'en_cours',
    assigne: 'Nom',
    dateEcheance: '2025-01-15',
    dateCreation: '2024-12-01',
    tags: ['design', 'frontend', 'clients']
  },
  {
    id: '2',
    titre: 'Implémenter l\'API de conversion prospects',
    description: 'Créer l\'endpoint pour convertir un prospect en client avec toutes les validations',
    priorite: 'urgente',
    statut: 'a_faire',
    assigne: 'Prénom',
    dateEcheance: '2024-12-20',
    dateCreation: '2024-12-01',
    tags: ['api', 'backend', 'prospects']
  },
  {
    id: '3',
    titre: 'Tests unitaires pour les composants',
    description: 'Écrire les tests unitaires pour tous les composants React de l\'application',
    priorite: 'moyenne',
    statut: 'a_faire',
    assigne: 'Nom',
    dateEcheance: '2025-01-30',
    dateCreation: '2024-12-01',
    tags: ['tests', 'frontend', 'qualité']
  },
  {
    id: '4',
    titre: 'Optimisation des performances',
    description: 'Analyser et optimiser les performances de l\'application, notamment le chargement des données',
    priorite: 'moyenne',
    statut: 'terminee',
    assigne: 'Prénom',
    dateEcheance: '2024-12-10',
    dateCreation: '2024-11-15',
    tags: ['performance', 'optimisation']
  },
  {
    id: '5',
    titre: 'Documentation technique',
    description: 'Rédiger la documentation technique complète de l\'application',
    priorite: 'basse',
    statut: 'a_faire',
    assigne: 'Nom',
    dateEcheance: '2025-02-15',
    dateCreation: '2024-12-01',
    tags: ['documentation', 'technique']
  },
  {
    id: '6',
    titre: 'Intégration AirTable',
    description: 'Connecter l\'application à AirTable pour la gestion des données',
    priorite: 'haute',
    statut: 'en_cours',
    assigne: 'Prénom',
    dateEcheance: '2025-01-25',
    dateCreation: '2024-12-01',
    tags: ['airtable', 'intégration', 'données']
  },
  {
    id: '7',
    titre: 'Système de notifications',
    description: 'Implémenter un système de notifications en temps réel pour les mises à jour',
    priorite: 'moyenne',
    statut: 'annulee',
    assigne: 'Nom',
    dateEcheance: '2025-02-01',
    dateCreation: '2024-11-20',
    tags: ['notifications', 'temps réel']
  },
  {
    id: '8',
    titre: 'Interface d\'administration',
    description: 'Créer une interface d\'administration pour gérer les utilisateurs et les paramètres',
    priorite: 'haute',
    statut: 'a_faire',
    assigne: 'Prénom',
    dateEcheance: '2025-01-20',
    dateCreation: '2024-12-01',
    tags: ['admin', 'interface', 'gestion']
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const priorite = searchParams.get('priorite') || '';
    const statut = searchParams.get('statut') || '';
    const assigne = searchParams.get('assigne') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filtrer les todos
    let filteredTodos = mockTodos.filter(todo => {
      const matchesSearch = !search || 
        todo.titre.toLowerCase().includes(search.toLowerCase()) ||
        todo.description.toLowerCase().includes(search.toLowerCase()) ||
        todo.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesPriorite = !priorite || priorite === 'tous' || todo.priorite === priorite;
      const matchesStatut = !statut || statut === 'tous' || todo.statut === statut;
      const matchesAssigne = !assigne || assigne === 'tous' || todo.assigne === assigne;
      
      return matchesSearch && matchesPriorite && matchesStatut && matchesAssigne;
    });

    // Trier les todos
    if (sortBy) {
      filteredTodos.sort((a, b) => {
        const aValue = a[sortBy as keyof Todo] || '';
        const bValue = b[sortBy as keyof Todo] || '';
        
        if (sortOrder === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTodos = filteredTodos.slice(startIndex, endIndex);

    return NextResponse.json({
      todos: paginatedTodos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredTodos.length / limit),
        totalItems: filteredTodos.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);

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
    if (!body.titre) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    // Créer une nouvelle tâche
    const newTodo: Todo = {
      id: (mockTodos.length + 1).toString(),
      titre: body.titre,
      description: body.description || '',
      priorite: body.priorite || 'moyenne',
      statut: body.statut || 'a_faire',
      assigne: body.assigne || '',
      dateEcheance: body.dateEcheance || '',
      dateCreation: new Date().toISOString().split('T')[0],
      tags: body.tags || []
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockTodos.push(newTodo);

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 