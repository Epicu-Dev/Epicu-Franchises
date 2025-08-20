interface Prospect {
  id: string;
  siret: string;
  nomEtablissement: string;
  ville: string;
  telephone: string;
  categorie: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
  statut: 'a_contacter' | 'en_discussion' | 'glacial';
  datePremierRendezVous: string;
  dateRelance: string;
  vientDeRencontrer: boolean;
  commentaire: string;
  suiviPar: string;
  email?: string;
  adresse?: string;
}

// Données mock partagées pour les prospects
export const mockProspects: Prospect[] = [
  {
    id: '1',
    siret: '12345678901234',
    nomEtablissement: 'L\'ambiance',
    ville: 'Paris',
    telephone: '01 23 45 67 89',
    categorie: 'FOOD',
    statut: 'a_contacter',
    datePremierRendezVous: '2025-07-05',
    dateRelance: '2025-07-10',
    vientDeRencontrer: false,
    commentaire: 'Commentaires',
    suiviPar: 'Nom',
    email: 'contact@ambiance.fr',
    adresse: '123 Rue de l\'ambiance, 75001 Paris'
  },
  {
    id: '2',
    siret: '98765432109876',
    nomEtablissement: 'Le Petit Bistrot',
    ville: 'Lyon',
    telephone: '01 98 76 54 32',
    categorie: 'FOOD',
    statut: 'en_discussion',
    datePremierRendezVous: '2025-07-10',
    dateRelance: '2025-07-15',
    vientDeRencontrer: true,
    commentaire: 'Intéressé par nos services',
    suiviPar: 'Prénom',
    email: 'reservation@petitbistrot.fr',
    adresse: '45 Avenue du Bistrot, 69001 Lyon'
  },
  {
    id: '3',
    siret: '11223344556677',
    nomEtablissement: 'Boutique Mode',
    ville: 'Marseille',
    telephone: '04 56 78 90 12',
    categorie: 'SHOP',
    statut: 'glacial',
    datePremierRendezVous: '2025-07-15',
    dateRelance: '2025-07-20',
    vientDeRencontrer: false,
    commentaire: 'À relancer dans 2 semaines',
    suiviPar: 'Nom',
    email: 'info@boutiquemode.fr',
    adresse: '78 Rue de la Mode, 13001 Marseille'
  },
  {
    id: '4',
    siret: '99887766554433',
    nomEtablissement: 'Café Central',
    ville: 'Nantes',
    telephone: '02 34 56 78 90',
    categorie: 'FOOD',
    statut: 'en_discussion',
    datePremierRendezVous: '2025-07-20',
    dateRelance: '2025-07-25',
    vientDeRencontrer: true,
    commentaire: 'Très intéressé, demande de devis',
    suiviPar: 'Prénom',
    email: 'contact@cafecentral.fr',
    adresse: '12 Place Centrale, 44000 Nantes'
  },
  {
    id: '5',
    siret: '55667788990011',
    nomEtablissement: 'Restaurant Gourmet',
    ville: 'Toulouse',
    telephone: '03 45 67 89 01',
    categorie: 'FOOD',
    statut: 'a_contacter',
    datePremierRendezVous: '2025-07-25',
    dateRelance: '2025-07-30',
    vientDeRencontrer: false,
    commentaire: 'Prospect chaud, à contacter rapidement',
    suiviPar: 'Nom',
    email: 'reservation@gourmet.fr',
    adresse: '56 Rue Gourmet, 31000 Toulouse'
  },
  {
    id: '6',
    siret: '22334455667788',
    nomEtablissement: 'Boulangerie Artisanale',
    ville: 'Bordeaux',
    telephone: '05 67 89 01 23',
    categorie: 'FOOD',
    statut: 'a_contacter',
    datePremierRendezVous: '2025-07-30',
    dateRelance: '2025-08-05',
    vientDeRencontrer: false,
    commentaire: 'Nouveau prospect, première prise de contact',
    suiviPar: 'Prénom',
    email: 'contact@boulangerie.fr',
    adresse: '89 Rue de la Boulangerie, 33000 Bordeaux'
  },
  {
    id: '7',
    siret: '88990011223344',
    nomEtablissement: 'Salon de Coiffure',
    ville: 'Lille',
    telephone: '06 78 90 12 34',
    categorie: 'BEAUTY',
    statut: 'glacial',
    datePremierRendezVous: '2025-08-05',
    dateRelance: '2025-08-10',
    vientDeRencontrer: false,
    commentaire: 'Prospect froid, pas de réponse',
    suiviPar: 'Nom',
    email: 'info@saloncoiffure.fr',
    adresse: '34 Avenue de la Coiffure, 59000 Lille'
  },
  {
    id: '8',
    siret: '44556677889900',
    nomEtablissement: 'Pizzeria Bella',
    ville: 'Dijon',
    telephone: '07 89 01 23 45',
    categorie: 'FOOD',
    statut: 'en_discussion',
    datePremierRendezVous: '2025-08-10',
    dateRelance: '2025-08-15',
    vientDeRencontrer: true,
    commentaire: 'En négociation, prix à ajuster',
    suiviPar: 'Prénom',
    email: 'contact@pizzeriabella.fr',
    adresse: '67 Rue de la Pizza, 21000 Dijon'
  },
  {
    id: '9',
    siret: '66778899001122',
    nomEtablissement: 'Agence de Voyage',
    ville: 'Strasbourg',
    telephone: '08 90 12 34 56',
    categorie: 'TRAVEL',
    statut: 'a_contacter',
    datePremierRendezVous: '2025-08-15',
    dateRelance: '2025-08-20',
    vientDeRencontrer: false,
    commentaire: 'Intéressé par nos services de réservation',
    suiviPar: 'Nom',
    email: 'contact@agencevoyage.fr',
    adresse: '90 Boulevard du Voyage, 67000 Strasbourg'
  },
  {
    id: '10',
    siret: '00112233445566',
    nomEtablissement: 'Salle de Sport Fun',
    ville: 'Rennes',
    telephone: '09 01 23 45 67',
    categorie: 'FUN',
    statut: 'en_discussion',
    datePremierRendezVous: '2025-08-20',
    dateRelance: '2025-08-25',
    vientDeRencontrer: true,
    commentaire: 'Prospect très motivé, rendez-vous prévu',
    suiviPar: 'Prénom',
    email: 'info@sallesportfun.fr',
    adresse: '123 Rue du Sport, 35000 Rennes'
  }
];

export type { Prospect };
