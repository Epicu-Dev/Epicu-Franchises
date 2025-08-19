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

// Données mock pour les todos (copie de l'autre fichier)
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: todoId } = await params;
    const todo = mockTodos.find(t => t.id === todoId);

    if (!todo) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error);
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
    const { id: todoId } = await params;
    const body = await request.json();
    
    const todoIndex = mockTodos.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la tâche
    const updatedTodo = {
      ...mockTodos[todoIndex],
      ...body,
      id: todoId // Garder l'ID original
    };

    // Dans un vrai projet, on mettrait à jour en base de données
    // mockTodos[todoIndex] = updatedTodo;

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Erreur lors de la modification de la tâche:', error);
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
    const { id: todoId } = await params;
    const todoIndex = mockTodos.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    // Dans un vrai projet, on supprimerait de la base de données
    // mockTodos.splice(todoIndex, 1);

    return NextResponse.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 