'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { Avatar } from '@heroui/avatar';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/table';
import {
  ArrowDownTrayIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

import { SortableColumnHeader } from '@/components/sortable-column-header';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { InvoiceStatusBadge } from '@/components/badges';
import { FormLabel } from '@/components';
import { useUser } from '@/contexts/user-context';
import { UserProfile, VilleEpicu } from '@/types/user';

interface Invoice {
  id: string;
  etat: 'Validée' | 'En attente';
  date: string;
  montant: string;
  typeFacture: string;
}

interface Document {
  id: string;
  type: string;
  dateAjout: string;
}

interface HistoryItem {
  id: string;
  personne: string;
  action: string;
  date: string;
  heure: string;
}

export default function ProfilPage() {
  const { userProfile, refreshUserProfile } = useUser();
  const [activeTab, setActiveTab] = useState<string>('informations');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Hook pour le tri du tableau historique
  const { sortField, sortDirection, handleSort, sortedData } = useSortableTable<HistoryItem>(history);

  // Hook pour le tri du tableau documents
  const {
    sortField: docSortField,
    sortDirection: docSortDirection,
    handleSort: handleDocSort,
    sortedData: sortedDocData
  } = useSortableTable<Document>(documents);

  // Hook pour le tri du tableau factures
  const {
    sortField: invoiceSortField,
    sortDirection: invoiceSortDirection,
    handleSort: handleInvoiceSort,
    sortedData: sortedInvoiceData
  } = useSortableTable<Invoice>(invoices);

  // Charger les données mock au montage
  useEffect(() => {
    // Données mock pour les factures (à remplacer par de vraies données API plus tard)
    setInvoices([
      {
        id: '1',
        etat: 'Validée',
        date: '10.07.2025',
        montant: '1450€67',
        typeFacture: 'Redevance annuelle'
      },
      {
        id: '2',
        etat: 'Validée',
        date: '10.07.2025',
        montant: '1450€67',
        typeFacture: 'Redevance annuelle'
      },
      {
        id: '3',
        etat: 'Validée',
        date: '10.07.2025',
        montant: '1450€67',
        typeFacture: 'Redevance annuelle'
      },
      {
        id: '4',
        etat: 'En attente',
        date: '10.07.2025',
        montant: '1450€67',
        typeFacture: 'Redevance mensuelle'
      },
      {
        id: '5',
        etat: 'Validée',
        date: '10.07.2025',
        montant: '1450€67',
        typeFacture: 'Droit d\'entrée'
      }
    ]);

    // Données mock pour les documents (à remplacer par de vraies données API plus tard)
    setDocuments([
      {
        id: '1',
        type: 'DIP',
        dateAjout: '12.08.2025'
      },
      {
        id: '2',
        type: 'Contrat de franchisé',
        dateAjout: '12.08.2025'
      },
      {
        id: '3',
        type: 'Autre',
        dateAjout: '12.08.2025'
      }
    ]);

    // Données mock pour l'historique (à remplacer par de vraies données API plus tard)
    setHistory([
      {
        id: '1',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Modification du profil',
        date: '12.07.2025',
        heure: '14:30'
      },
      {
        id: '2',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Connexion',
        date: '12.07.2025',
        heure: '09:15'
      },
      {
        id: '3',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Modification du profil',
        date: '12.07.2025',
        heure: '16:45'
      },
      {
        id: '4',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Connexion',
        date: '12.07.2025',
        heure: '08:30'
      },
      {
        id: '5',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Modification du profil',
        date: '12.07.2025',
        heure: '11:20'
      },
      {
        id: '6',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Connexion',
        date: '12.07.2025',
        heure: '13:15'
      },
      {
        id: '7',
        personne: userProfile?.firstname || 'Utilisateur',
        action: 'Ajout d\'un prospect',
        date: '12.07.2025',
        heure: '18:45'
      }
    ]);
  }, [userProfile?.firstname]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter la sauvegarde via l'API Epicu
      // Pour l'instant, on simule la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);

      // Rafraîchir les données utilisateur
      await refreshUserProfile();

      // Afficher un message de succès temporaire
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full bg-white dark:bg-gray-900">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500 dark:text-red-400">Erreur: {error}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="w-full">
        <Card className="w-full bg-white dark:bg-gray-900">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full text-primary">
      <Card className="w-full bg-white shadow-none">
        <CardBody className="p-6">
          {/* Onglets */}
          <Tabs
            className="w-full pt-3 mb-6"
            classNames={{
              cursor: "w-[50px]  left-[12px] h-1   rounded",
              tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
            }}
            selectedKey={activeTab}
            variant='underlined'
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab
              key="informations"
              title="Mes informations"
            />
            <Tab
              key="factures"
              title="Mes factures Epicu"
            />
            <Tab
              key="documents"
              title="Mes documents"
            />
            <Tab
              key="historique"
              title="Historique"
            />
          </Tabs>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          ) : (
            <div>
              {/* Contenu des onglets */}
              {activeTab === 'informations' && (
                <div className="space-y-6">
                  {/* En-tête du profil */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        className="w-20 h-20"
                        name={`${userProfile.firstname} ${userProfile.lastname}`}
                        size="lg"
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {userProfile.firstname} {userProfile.lastname}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{userProfile.role}</p>
                      </div>
                    </div>
                    <Button
                      className='text-base'
                      startContent={<PencilSquareIcon className="h-6 w-6" />}
                      variant='light'
                      onPress={() => setIsEditing(!isEditing)}
                    >
                      Modifier
                    </Button>
                  </div>

                  {/* Formulaire d'informations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-primary-light/20">

                      <FormLabel htmlFor="identifier" isRequired={false}>
                        Identifiant
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "text-primary-light/20 placeholder:text-primary-light/20",
                          inputWrapper: "bg-page-bg",
                        }}
                        id="identifier"
                        isReadOnly={!isEditing}
                        placeholder="Identifiant"
                        value={userProfile.identifier || ''}
                      />
                    </div>

                    <div className="space-y-4 text-primary-light/20">
                      <FormLabel htmlFor="password" isRequired={false}>
                        Mot de passe
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "text-primary-light/20 placeholder:text-primary-light/20",
                          inputWrapper: "bg-page-bg",
                        }}
                        id="password"
                        isReadOnly={!isEditing}
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="lastName" isRequired={true}>
                        Nom
                      </FormLabel>
                      <Input
                        isRequired
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        id="lastName"
                        isReadOnly={!isEditing}
                        placeholder="Nom"
                        value={userProfile.lastname}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="firstName" isRequired={true}>
                        Prénom
                      </FormLabel>
                      <Input
                        isRequired
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        id="firstName"
                        isReadOnly={!isEditing}
                        placeholder="Prénom"
                        value={userProfile.firstname}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="email" isRequired={true}>
                        Email de la ville
                      </FormLabel>
                      <Input
                        isRequired
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        id="email"
                        isReadOnly={!isEditing}
                        placeholder="email@epicu.fr"
                        type="email"
                        value={userProfile.email}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="phone" isRequired={true}>
                        Tel
                      </FormLabel>
                      <Input
                        isRequired
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        id="phone"
                        isReadOnly={!isEditing}
                        placeholder="06 00 00 00 00"
                        value={userProfile.telephone || ''}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="role" isRequired={true}>
                        Rôle
                      </FormLabel>
                      <Input
                        isRequired
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        id="role"
                        isReadOnly={!isEditing}
                        placeholder="Rôle"
                        value={userProfile.role}
                      />
                    </div>
                  </div>

                  {/* Bouton de sauvegarde */}

                  <div className="flex justify-center pt-6">
                    <Button
                      className='w-100'
                      color='primary'
                      onPress={handleSaveProfile}
                    >
                      Mettre à jour
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'factures' && (
                <div className="space-y-4">
                  <Table aria-label="Tableau des factures" shadow="none">
                    <TableHeader>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="etat"
                          label="Etat"
                          sortDirection={invoiceSortDirection}
                          sortField={invoiceSortField}
                          onSort={handleInvoiceSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="date"
                          label="Date"
                          sortDirection={invoiceSortDirection}
                          sortField={invoiceSortField}
                          onSort={handleInvoiceSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">Montant</TableColumn>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="typeFacture"
                          label="Type de facture"
                          sortDirection={invoiceSortDirection}
                          sortField={invoiceSortField}
                          onSort={handleInvoiceSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">Télécharger</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {sortedInvoiceData.map((invoice) => (
                        <TableRow key={invoice.id} className="border-t border-gray-100 dark:border-gray-700">
                          <TableCell className="font-light text-sm py-3">
                            <InvoiceStatusBadge status={invoice.etat} />
                          </TableCell>
                          <TableCell className="font-light text-sm">{invoice.date}</TableCell>
                          <TableCell className="font-light text-sm">{invoice.montant}</TableCell>
                          <TableCell className="font-light text-sm">{invoice.typeFacture}</TableCell>
                          <TableCell className="font-light text-sm">
                            <Button
                              isIconOnly
                              aria-label={`Télécharger la facture ${invoice.id}`}
                              size="md"
                              variant="light"
                            >
                              <ArrowDownTrayIcon className="w-5 h-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <Table aria-label="Tableau des documents" shadow="none">
                    <TableHeader>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="type"
                          label="Type de documents"
                          sortDirection={docSortDirection}
                          sortField={docSortField}
                          onSort={handleDocSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">Date d&apos;ajout</TableColumn>
                      <TableColumn className="font-light text-sm">Télécharger</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {sortedDocData.map((document) => (
                        <TableRow key={document.id} className="border-t border-gray-100 dark:border-gray-700">
                          <TableCell className="font-light text-sm py-3">{document.type}</TableCell>
                          <TableCell className="font-light text-sm">{document.dateAjout}</TableCell>
                          <TableCell className="font-light text-sm">
                            <Button
                              isIconOnly
                              aria-label={`Télécharger ${document.type}`}
                              size="sm"
                              variant="light"
                            >
                              <ArrowDownTrayIcon className="w-5 h-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'historique' && (
                <div className="space-y-4">
                  <Table aria-label="Tableau de l'historique" shadow="none">
                    <TableHeader>
                      <TableColumn className="font-light text-sm">Personne</TableColumn>
                      <TableColumn className="font-light text-sm">Action réalis&eacute;e</TableColumn>
                      <TableColumn className="font-light text-sm">Date de l&apos;action</TableColumn>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="heure"
                          label="Heure de l'action"
                          sortDirection={sortDirection}
                          sortField={sortField}
                          onSort={handleSort}
                        />
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((item) => (
                        <TableRow key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                          <TableCell className="font-light text-sm py-3">{item.personne}</TableCell>
                          <TableCell className="font-light text-sm">{item.action}</TableCell>
                          <TableCell className="font-light text-sm">{item.date}</TableCell>
                          <TableCell className="font-light text-sm">{item.heure}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 