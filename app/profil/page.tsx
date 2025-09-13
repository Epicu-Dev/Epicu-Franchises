'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

import { SortableColumnHeader } from '@/components/sortable-column-header';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { InvoiceStatusBadge } from '@/components/badges';
import { FormLabel } from '@/components';
import { useUser } from '@/contexts/user-context';
import { getValidAccessToken } from '@/utils/auth';

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
  const [activeTab] = useState<string>('informations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État local pour les champs du formulaire
  const [formData, setFormData] = useState({
    lastname: '',
    firstname: '',
    email_epicu: '',
    telephone: ''
  });
  
  // État pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

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

  // Initialiser les données du formulaire quand le profil utilisateur change
  useEffect(() => {
    if (userProfile) {
      setFormData({
        lastname: userProfile.lastname || '',
        firstname: userProfile.firstname || '',
        email_epicu: userProfile.email_epicu || '',
        telephone: userProfile.telephone || ''
      });
    }
  }, [userProfile]);

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

  // Fonction de validation des champs
  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'firstname':
        if (!value || !value.trim()) {
          errors.firstname = 'Le prénom est requis';
        } else {
          delete errors.firstname;
        }
        break;
      case 'lastname':
        if (!value || !value.trim()) {
          errors.lastname = 'Le nom est requis';
        } else {
          delete errors.lastname;
        }
        break;
      case 'email_epicu':
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email_epicu = 'Format d\'email invalide';
        } else {
          delete errors.email_epicu;
        }
        break;
      case 'telephone':
        if (value && value.trim() && !/^[0-9\s\-\+\(\)]+$/.test(value)) {
          errors.telephone = 'Format de téléphone invalide';
        } else {
          delete errors.telephone;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Fonction de gestion des changements de champs
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    validateField(fieldName, value);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation de tous les champs requis
      const requiredFields = ['firstname', 'lastname'];
      let hasErrors = false;

      requiredFields.forEach(field => {
        if (!validateField(field, formData[field as keyof typeof formData])) {
          hasErrors = true;
        }
      });

      if (hasErrors) {
        setError('Veuillez corriger les erreurs dans le formulaire');
        setLoading(false);

        return;
      }

      // Préparer les données pour l'API
      const updateData = {
        prenom: formData.firstname,
        nom: formData.lastname,
        emailEpicu: formData.email_epicu,
        telephone: formData.telephone
      };

      // Appel à l'API profil pour mettre à jour le profil
      const token = await getValidAccessToken();

      if (!token) throw new Error('Token d\'accès non trouvé');

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || 'Erreur lors de la mise à jour du profil');
      }

      // Rafraîchir les données utilisateur
      await refreshUserProfile();

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

  return (
    <div className="w-full text-primary">
      <Card className="w-full bg-white shadow-none text-primary">
        <CardBody className="p-6">
          {/* Onglets */}
          {/* <Tabs
            className="w-full pt-3 mb-2"
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
              key="documents"
              title="Mes documents"
            />
            <Tab
              key="historique"
              title="Historique"
            />
          </Tabs> */}

          {loading || !userProfile ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          ) : (
            <div>
              {/* Contenu des onglets */}
              {activeTab === 'informations' && (
                <div className="space-y-10 p-4">
                  {/* En-tête du profil */}
                  <div className="flex items-center justify-between text-primary">
                    <div className="flex items-center space-x-8">
                      <Avatar
                        className="w-20 h-20"
                        name={`${userProfile.firstname} ${userProfile.lastname}`}
                        size="lg"
                        src={userProfile.trombi?.[0]?.url}
                      />
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {userProfile.firstname} {userProfile.lastname}
                        </h2>
                        <p className='font-light'>{userProfile.role}</p>
                      </div>
                    </div>

                  </div>

                  {/* Formulaire d'informations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-primary-light/20">

                      <FormLabel htmlFor="identifier" isRequired={false}>
                        Email de connexion
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "text-primary-light/20 placeholder:text-primary-light/20",
                          inputWrapper: "bg-page-bg",
                        }}
                        id="identifier"
                        isReadOnly={true}
                        placeholder={userProfile.email || ''}
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
                        isReadOnly={true}

                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="lastName" isRequired={true}>
                        Nom
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        errorMessage={fieldErrors.lastname}
                        id="lastName"
                        isInvalid={!!fieldErrors.lastname}
                        isRequired={true}
                        placeholder="Nom"
                        value={formData.lastname}
                        onChange={(e) => handleFieldChange('lastname', e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="firstName" isRequired={true}>
                        Prénom
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        errorMessage={fieldErrors.firstname}
                        id="firstName"
                        isInvalid={!!fieldErrors.firstname}
                        isRequired={true}
                        placeholder="Prénom"
                        value={formData.firstname}
                        onChange={(e) => handleFieldChange('firstname', e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="email_epicu" isRequired={false}>
                        Email de la ville
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        errorMessage={fieldErrors.email_epicu}
                        id="email_epicu"
                        isInvalid={!!fieldErrors.email_epicu}
                        placeholder="email@epicu.fr"
                        type="email"
                        value={formData.email_epicu}
                        onChange={(e) => handleFieldChange('email_epicu', e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">

                      <FormLabel htmlFor="phone" isRequired={false}>
                        Tel
                      </FormLabel>
                      <Input
                        classNames={{
                          input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                          inputWrapper: "bg-page-bg border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                          label: "text-gray-700 dark:text-gray-300 font-medium"
                        }}
                        errorMessage={fieldErrors.telephone}
                        id="phone"
                        isInvalid={!!fieldErrors.telephone}
                        placeholder="06 00 00 00 00"
                        value={formData.telephone}
                        onChange={(e) => handleFieldChange('telephone', e.target.value)}
                      />
                    </div>

                  </div>

                  {/* Message d'erreur global */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Bouton de sauvegarde */}
                  <div className="flex justify-center pt-6">
                    <Button
                      className='w-100'
                      color='primary'
                      isDisabled={loading || Object.keys(fieldErrors).length > 0 || !formData.firstname || !formData.lastname}
                      isLoading={loading}
                      onPress={handleSaveProfile}
                    >
                      {loading ? 'Mise à jour...' : 'Mettre à jour'}
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