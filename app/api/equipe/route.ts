import { NextRequest, NextResponse } from 'next/server';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  category: 'siege' | 'franchise' | 'prestataire';
  email?: string;
  phone?: string;
  department?: string;
  joinDate?: string;
}

// Données de démonstration
const demoMembers: TeamMember[] = [
  // Membres du siège
  { id: '1', name: 'Camille Durand', role: 'Directeur', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'camille.durand@epicu.fr', phone: '01 23 45 67 89', department: 'Direction', joinDate: '2020-01-15' },
  { id: '2', name: 'Marie Laurent', role: 'Responsable RH', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'marie.laurent@epicu.fr', phone: '01 23 45 67 90', department: 'Ressources Humaines', joinDate: '2019-03-20' },
  { id: '3', name: 'Thomas Moreau', role: 'Directeur Commercial', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'thomas.moreau@epicu.fr', phone: '01 23 45 67 91', department: 'Commercial', joinDate: '2018-06-10' },
  { id: '4', name: 'Sophie Dubois', role: 'Comptable', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'sophie.dubois@epicu.fr', phone: '01 23 45 67 92', department: 'Comptabilité', joinDate: '2021-09-05' },
  { id: '5', name: 'Pierre Martin', role: 'Développeur', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'pierre.martin@epicu.fr', phone: '01 23 45 67 93', department: 'IT', joinDate: '2022-01-15' },
  { id: '6', name: 'Julie Bernard', role: 'Marketing Manager', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'julie.bernard@epicu.fr', phone: '01 23 45 67 94', department: 'Marketing', joinDate: '2020-11-30' },
  { id: '7', name: 'Nicolas Petit', role: 'Responsable Qualité', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'nicolas.petit@epicu.fr', phone: '01 23 45 67 95', department: 'Qualité', joinDate: '2019-08-12' },
  { id: '8', name: 'Anne Roux', role: 'Assistante', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'anne.roux@epicu.fr', phone: '01 23 45 67 96', department: 'Direction', joinDate: '2021-04-18' },
  { id: '9', name: 'Lucas Simon', role: 'Technicien', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'lucas.simon@epicu.fr', phone: '01 23 45 67 97', department: 'Technique', joinDate: '2022-03-22' },
  { id: '10', name: 'Emma Leroy', role: 'Chargée de Communication', location: 'Siège', category: 'siege', avatar: '/api/placeholder/150/150', email: 'emma.leroy@epicu.fr', phone: '01 23 45 67 98', department: 'Communication', joinDate: '2021-07-14' },

  // Franchisés
  { id: '11', name: 'Camille Durand', role: 'Franchisé', location: 'Paris', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.paris@epicu.fr', phone: '01 23 45 67 99', department: 'Franchise', joinDate: '2020-02-15' },
  { id: '12', name: 'Camille Durand', role: 'Franchisé', location: 'Lyon', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.lyon@epicu.fr', phone: '04 23 45 67 89', department: 'Franchise', joinDate: '2020-03-20' },
  { id: '13', name: 'Camille Durand', role: 'Franchisé', location: 'Marseille', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.marseille@epicu.fr', phone: '04 23 45 67 90', department: 'Franchise', joinDate: '2020-04-10' },
  { id: '14', name: 'Camille Durand', role: 'Franchisé', location: 'Toulouse', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.toulouse@epicu.fr', phone: '05 23 45 67 89', department: 'Franchise', joinDate: '2020-05-05' },
  { id: '15', name: 'Camille Durand', role: 'Franchisé', location: 'Bordeaux', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.bordeaux@epicu.fr', phone: '05 23 45 67 90', department: 'Franchise', joinDate: '2020-06-12' },
  { id: '16', name: 'Camille Durand', role: 'Franchisé', location: 'Nantes', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.nantes@epicu.fr', phone: '02 23 45 67 89', department: 'Franchise', joinDate: '2020-07-18' },
  { id: '17', name: 'Camille Durand', role: 'Franchisé', location: 'Strasbourg', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.strasbourg@epicu.fr', phone: '03 23 45 67 89', department: 'Franchise', joinDate: '2020-08-25' },
  { id: '18', name: 'Camille Durand', role: 'Franchisé', location: 'Nice', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.nice@epicu.fr', phone: '04 23 45 67 91', department: 'Franchise', joinDate: '2020-09-30' },
  { id: '19', name: 'Camille Durand', role: 'Franchisé', location: 'Montpellier', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.montpellier@epicu.fr', phone: '04 23 45 67 92', department: 'Franchise', joinDate: '2020-10-15' },
  { id: '20', name: 'Camille Durand', role: 'Franchisé', location: 'Rennes', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.rennes@epicu.fr', phone: '02 23 45 67 90', department: 'Franchise', joinDate: '2020-11-20' },
  { id: '21', name: 'Camille Durand', role: 'Franchisé', location: 'Lille', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.lille@epicu.fr', phone: '03 23 45 67 90', department: 'Franchise', joinDate: '2020-12-05' },
  { id: '22', name: 'Camille Durand', role: 'Franchisé', location: 'Reims', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.reims@epicu.fr', phone: '03 23 45 67 91', department: 'Franchise', joinDate: '2021-01-10' },
  { id: '23', name: 'Camille Durand', role: 'Franchisé', location: 'Dijon', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.dijon@epicu.fr', phone: '03 23 45 67 92', department: 'Franchise', joinDate: '2021-02-15' },
  { id: '24', name: 'Camille Durand', role: 'Franchisé', location: 'Grenoble', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.grenoble@epicu.fr', phone: '04 23 45 67 93', department: 'Franchise', joinDate: '2021-03-20' },
  { id: '25', name: 'Camille Durand', role: 'Franchisé', location: 'Angers', category: 'franchise', avatar: '/api/placeholder/150/150', email: 'camille.durand.angers@epicu.fr', phone: '02 23 45 67 91', department: 'Franchise', joinDate: '2021-04-25' },

  // Prestataires
  { id: '26', name: 'Camille Durand', role: 'Prestataire', location: 'Paris', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire@epicu.fr', phone: '01 23 45 67 92', department: 'Prestataire', joinDate: '2021-05-30' },
  { id: '27', name: 'Camille Durand', role: 'Prestataire', location: 'Lyon', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.lyon@epicu.fr', phone: '04 23 45 67 94', department: 'Prestataire', joinDate: '2021-06-05' },
  { id: '28', name: 'Camille Durand', role: 'Prestataire', location: 'Marseille', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.marseille@epicu.fr', phone: '04 23 45 67 95', department: 'Prestataire', joinDate: '2021-07-10' },
  { id: '29', name: 'Camille Durand', role: 'Prestataire', location: 'Toulouse', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.toulouse@epicu.fr', phone: '05 23 45 67 91', department: 'Prestataire', joinDate: '2021-08-15' },
  { id: '30', name: 'Camille Durand', role: 'Prestataire', location: 'Bordeaux', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.bordeaux@epicu.fr', phone: '05 23 45 67 92', department: 'Prestataire', joinDate: '2021-09-20' },
  { id: '31', name: 'Camille Durand', role: 'Prestataire', location: 'Nantes', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.nantes@epicu.fr', phone: '02 23 45 67 92', department: 'Prestataire', joinDate: '2021-10-25' },
  { id: '32', name: 'Camille Durand', role: 'Prestataire', location: 'Strasbourg', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.strasbourg@epicu.fr', phone: '03 23 45 67 93', department: 'Prestataire', joinDate: '2021-11-30' },
  { id: '33', name: 'Camille Durand', role: 'Prestataire', location: 'Nice', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.nice@epicu.fr', phone: '04 23 45 67 96', department: 'Prestataire', joinDate: '2021-12-05' },
  { id: '34', name: 'Camille Durand', role: 'Prestataire', location: 'Montpellier', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.montpellier@epicu.fr', phone: '04 23 45 67 97', department: 'Prestataire', joinDate: '2022-01-10' },
  { id: '35', name: 'Camille Durand', role: 'Prestataire', location: 'Rennes', category: 'prestataire', avatar: '/api/placeholder/150/150', email: 'camille.durand.prestataire.rennes@epicu.fr', phone: '02 23 45 67 93', department: 'Prestataire', joinDate: '2022-02-15' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '35');

    let filteredMembers = [...demoMembers];

    // Filtrage par catégorie
    if (category && category !== 'tout') {
      filteredMembers = filteredMembers.filter(member => member.category === category);
    }

    // Filtrage par recherche
    if (search) {
      const searchLower = search.toLowerCase();

      filteredMembers = filteredMembers.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower) ||
        member.location.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.department?.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

    const totalItems = filteredMembers.length;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      members: paginatedMembers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des membres de l\'équipe:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des membres de l\'équipe' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.name || !body.role || !body.location || !body.category) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Simulation de l'ajout d'un nouveau membre
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: body.name,
      role: body.role,
      location: body.location,
      category: body.category,
      avatar: body.avatar || '/api/placeholder/150/150',
      email: body.email,
      phone: body.phone,
      department: body.department,
      joinDate: new Date().toISOString().split('T')[0]
    };

    // En production, on ajouterait le membre à la base de données
    // demoMembers.push(newMember);

    return NextResponse.json({
      message: 'Membre ajouté avec succès',
      member: newMember
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);

    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du membre' },
      { status: 500 }
    );
  }
}
