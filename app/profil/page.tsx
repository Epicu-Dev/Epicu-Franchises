'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { Avatar } from '@heroui/avatar';
import {
  PencilIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

interface UserProfile {
  id: string;
  identifier: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'payee' | 'en_attente' | 'retard';
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface HistoryItem {
  id: string;
  action: string;
  date: string;
  description: string;
}

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<string>('informations');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    identifier: '',
    firstName: 'Dominique',
    lastName: 'Durand',
    email: 'rennes@epicu.fr',
    phone: '06 00 00 00 00',
    role: 'Franchisé'
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler le chargement des données
      await new Promise(resolve => setTimeout(resolve, 500));

      // Données mock pour les factures
      setInvoices([
        {
          id: '1',
          number: 'FAC-2025-001',
          date: '2025-06-15',
          amount: 1457.98,
          status: 'payee'
        },
        {
          id: '2',
          number: 'FAC-2025-002',
          date: '2025-06-20',
          amount: 2340.50,
          status: 'en_attente'
        },
        {
          id: '3',
          number: 'FAC-2025-003',
          date: '2025-06-25',
          amount: 890.25,
          status: 'retard'
        }
      ]);

      // Données mock pour les documents
      setDocuments([
        {
          id: '1',
          name: 'Contrat de franchise.pdf',
          type: 'PDF',
          uploadDate: '2025-01-15',
          size: '2.5 MB'
        },
        {
          id: '2',
          name: 'Guide utilisateur.docx',
          type: 'DOCX',
          uploadDate: '2025-02-20',
          size: '1.8 MB'
        },
        {
          id: '3',
          name: 'Certificat formation.pdf',
          type: 'PDF',
          uploadDate: '2025-03-10',
          size: '3.2 MB'
        }
      ]);

      // Données mock pour l'historique
      setHistory([
        {
          id: '1',
          action: 'Connexion',
          date: '2025-06-15 14:30',
          description: 'Connexion réussie depuis l\'adresse IP 192.168.1.100'
        },
        {
          id: '2',
          action: 'Modification profil',
          date: '2025-06-10 09:15',
          description: 'Mise à jour des informations personnelles'
        },
        {
          id: '3',
          action: 'Téléchargement document',
          date: '2025-06-05 16:45',
          description: 'Téléchargement du guide utilisateur'
        }
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      // Ici on pourrait appeler l'API pour sauvegarder
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'payee':
        return 'Payée';
      case 'en_attente':
        return 'En attente';
      case 'retard':
        return 'Retard';
      default:
        return status;
    }
  };

  if (loading) {
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
    <div className="w-full">
      <Card className="w-full bg-white dark:bg-gray-900 shadow-none">
        <CardBody className="p-6">
          {/* Onglets */}
          <Tabs
            className="w-full mb-6"
            classNames={{
              cursor: "w-[50px] left-[12px] h-1",
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

          {/* Contenu des onglets */}
          {activeTab === 'informations' && (
            <div className="space-y-6">
              {/* En-tête du profil */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar
                    className="w-20 h-20"
                    name={`${profile.firstName} ${profile.lastName}`}
                    size="lg"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{profile.role}</p>
                  </div>
                </div>
                <Button
                  className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  startContent={<PencilIcon className="h-4 w-4" />}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  Modifier
                </Button>
              </div>

              {/* Formulaire d'informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Identifiant"
                  placeholder="Identifiant"
                  value={profile.identifier}
                  onChange={(e) => setProfile(prev => ({ ...prev, identifier: e.target.value }))}
                />

                <Input
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Mot de passe"
                  placeholder="••••••••"
                  type="password"
                />

                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Nom*"
                  placeholder="Nom"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                />

                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Prénom*"
                  placeholder="Prénom"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                />

                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Email de la ville*"
                  placeholder="email@epicu.fr"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                />

                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Tel*"
                  placeholder="06 00 00 00 00"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                />

                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                    inputWrapper: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-gray-400 dark:focus-within:border-gray-400",
                    label: "text-gray-700 dark:text-gray-300 font-medium"
                  }}
                  isReadOnly={!isEditing}
                  label="Rôle*"
                  placeholder="Rôle"
                  value={profile.role}
                  onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              {/* Bouton de sauvegarde */}
              {isEditing && (
                <div className="flex justify-center pt-6">
                  <Button
                    className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    size="lg"
                    onPress={handleSaveProfile}
                  >
                    Mettre à jour
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'factures' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Mes factures Epicu</h3>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{invoice.number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatAmount(invoice.amount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'payee' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        invoice.status === 'en_attente' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Mes documents</h3>
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{document.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {document.type} • {document.size} • {formatDate(document.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      size="sm"
                      variant="light"
                    >
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'historique' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Historique des activités</h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{item.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 