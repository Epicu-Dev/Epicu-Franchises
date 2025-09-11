"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";
import { SelectItem } from "@heroui/select";

import { StyledSelect } from "@/components/styled-select";
import { FormLabel } from "@/components";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface Invoice {
  id: string;
  categorie: string;
  nomEtablissement: string;
  date: string;
  montant: number;
  typePrestation: string;
  statut: string;
  commentaire?: string;
}

interface Client {
  id: string;
  nomEtablissement: string;
  raisonSociale: string;
  ville?: string;
  categorie?: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
  numeroSiret?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  publications?: Array<{ id: string; nom: string; datePublication: string }>;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoice: Invoice | null;
  onSave: (invoice: any) => Promise<void>;
  onEdit: (invoice: any) => Promise<void>;
}

export default function InvoiceModal({
  isOpen,
  onOpenChange,
  selectedInvoice,
  onSave,
  onEdit,
}: InvoiceModalProps) {
  const { authFetch } = useAuthFetch();
  const [newInvoice, setNewInvoice] = useState({
    category: "shop",
    establishmentName: "",
    date: "",
    amount: "",
    serviceType: "",
    status: "en_attente",
    comment: "",
  });

  // États pour la recherche de client
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSearchResults, setShowClientSearchResults] = useState(false);

  // États pour la sélection de publication
  const [publications, setPublications] = useState<{ id: string; nom: string; datePublication: string }[]>([]);
  const [selectedPublication, setSelectedPublication] = useState<string>("");
  const [selectedPublicationDisplay, setSelectedPublicationDisplay] = useState<string>("");

  // État pour la facture de tournage
  const [tournageFactureStatus, setTournageFactureStatus] = useState<string>("");
  const [tournageFactureStatusDisplay, setTournageFactureStatusDisplay] = useState<string>("");

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (selectedInvoice) {
        // Mode édition
        setNewInvoice({
          category: selectedInvoice.categorie,
          establishmentName: selectedInvoice.nomEtablissement,
          date: selectedInvoice.date,
          amount: selectedInvoice.montant.toString(),
          serviceType: selectedInvoice.typePrestation,
          status: selectedInvoice.statut,
          comment: selectedInvoice.commentaire || "",
        });
        setClientSearchTerm(selectedInvoice.nomEtablissement);

        // Rechercher automatiquement le client
        searchClientForInvoice(selectedInvoice.nomEtablissement);
      } else {
        // Mode ajout
        setNewInvoice({
          category: "shop",
          establishmentName: "",
          date: "",
          amount: "",
          serviceType: "",
          status: "en_attente",
          comment: "",
        });
        setClientSearchTerm("");
        setSelectedClient(null);
      }
    }
  }, [isOpen, selectedInvoice]);

  const searchClientForInvoice = async (establishmentName: string) => {
    try {
      const response = await authFetch(`/api/clients/clients?q=${encodeURIComponent(establishmentName)}&limit=10`);

      if (response.ok) {
        const data = await response.json();
        const clients = data.clients || [];

        const matchingClient = clients.find((client: Client) =>
          client.nomEtablissement.toLowerCase() === establishmentName.toLowerCase()
        );

        if (matchingClient) {
          setSelectedClient(matchingClient);
          setClientSearchTerm(matchingClient.nomEtablissement);

          setNewInvoice(prev => ({
            ...prev,
            establishmentName: matchingClient.nomEtablissement,
            category: matchingClient.categorie?.toLowerCase() || prev.category,
          }));
        }
      }
    } catch (err) {
      console.warn("Impossible de charger les informations du client:", err);
    }
  };

  const searchClients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientSearchResults([]);
      setShowClientSearchResults(false);
      return;
    }

    try {
      setIsSearchingClient(true);

      const response = await authFetch(`/api/clients/clients?q=${encodeURIComponent(searchTerm)}&limit=10`);

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche de clients");
      }

      const data = await response.json();
      setClientSearchResults(data.clients || []);
      setShowClientSearchResults(true);
    } catch (err) {
    } finally {
      setIsSearchingClient(false);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.nomEtablissement);
    setShowClientSearchResults(false);

    setNewInvoice(prev => ({
      ...prev,
      establishmentName: client.nomEtablissement,
      category: client.categorie?.toLowerCase() || "shop",
    }));


    // Les publications seront automatiquement mises à jour via le useEffect
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setClientSearchTerm("");
    setNewInvoice(prev => ({
      ...prev,
      establishmentName: "",
      category: "shop",
    }));
    setClientSearchResults([]);
    setShowClientSearchResults(false);
    // Réinitialiser aussi la sélection de publication et facture de tournage
    setSelectedPublication("");
    setSelectedPublicationDisplay("");
    setPublications([]);
    setTournageFactureStatus("");
    setTournageFactureStatusDisplay("");
  };

  // Mettre à jour les publications quand selectedClient change
  useEffect(() => {
    setPublications(selectedClient?.publications || []);
    setSelectedPublication("");
    setSelectedPublicationDisplay("");
  }, [selectedClient]);

  // Synchroniser l'affichage avec la sélection
  useEffect(() => {
    if (selectedPublication && publications.length > 0) {
      const pub = publications.find(p => p.id === selectedPublication);
      if (pub) {
        setSelectedPublicationDisplay(`${pub.nom || `Publication ${pub.id}`} - ${new Date(pub.datePublication).toLocaleDateString('fr-FR')}`);
      }
    } else {
      setSelectedPublicationDisplay("");
    }
  }, [selectedPublication, publications]);

  // Synchroniser l'affichage du statut de facture
  useEffect(() => {
    if (tournageFactureStatus) {
      setTournageFactureStatusDisplay(tournageFactureStatus);
    } else {
      setTournageFactureStatusDisplay("");
    }
  }, [tournageFactureStatus]);

  // Recherche de clients avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm) {
        searchClients(clientSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);



  const handleSave = async () => {
    try {
      const invoiceData = {
        'Prestation demandée': newInvoice.serviceType,
        'Client': newInvoice.establishmentName,
        "Date d'émission": newInvoice.date,
        'Statut facture': tournageFactureStatus,
        'Montant total brut': parseFloat(newInvoice.amount),
        'Commentaire': newInvoice.comment,
      };

      if (selectedInvoice) {
        await onEdit(invoiceData);
      } else {
        await onSave(invoiceData);
      }

      // Réinitialiser le formulaire
      setNewInvoice({
        category: "shop",
        establishmentName: "",
        date: "",
        amount: "",
        serviceType: "",
        status: "en_attente",
        comment: "",
      });
      setSelectedClient(null);
      setClientSearchTerm("");
      setSelectedPublication("");
      setSelectedPublicationDisplay("");
      setPublications([]);
      setTournageFactureStatus("");
      setTournageFactureStatusDisplay("");
      onOpenChange(false);
    } catch (err) {
    }
  };

  const handleCancel = () => {
    setNewInvoice({
      category: "shop",
      establishmentName: "",
      date: "",
      amount: "",
      serviceType: "",
      status: "en_attente",
      comment: "",
    });
    setSelectedClient(null);
    setClientSearchTerm("");
    setSelectedPublication("");
    setSelectedPublicationDisplay("");
    setPublications([]);
    setTournageFactureStatus("");
    setTournageFactureStatusDisplay("");
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader className="flex justify-center">
          {selectedInvoice ? "Modifier la facture" : "Ajouter une nouvelle facture"}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Recherche de client */}
            <div className="relative">
              <FormLabel htmlFor="clientSearch" isRequired={true}>
                Rechercher un client
              </FormLabel>
              <Input
                isRequired
                endContent={
                  isSearchingClient ? (
                    <Spinner size="sm" />
                  ) : (
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  )
                }
                id="clientSearch"
                placeholder="Rechercher par nom, email, téléphone..."
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                value={clientSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setClientSearchTerm(value);
                  if (!value) {
                    clearSelectedClient();
                  }
                }}
                onFocus={() => {
                  if (clientSearchTerm && clientSearchResults.length > 0) {
                    setShowClientSearchResults(true);
                  }
                }}
              />

              {/* Résultats de recherche */}
              {showClientSearchResults && clientSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clientSearchResults.map((client) => (
                    <div
                      key={client.id}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      onClick={() => selectClient(client)}
                      onKeyDown={(e) => e.key === 'Enter' && selectClient(client)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {client.nomEtablissement}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {client.raisonSociale}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {client.ville && `${client.ville} • `}
                        {client.email && `${client.email} • `}
                        {client.telephone && client.telephone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Encart d'informations du client sélectionné */}
            {selectedClient && (
              <div className="bg-page-bg border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-sm text-primary-light mb-1">
                      Client sélectionné
                    </h4>
                    <p className="font-medium text-lg">
                      {selectedClient.nomEtablissement}
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-primary-light"
                    onPress={clearSelectedClient}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Sélection de publication */}
            {selectedClient && (
              <>
                <FormLabel htmlFor="publication" isRequired={true}>
                  Publication concernée
                </FormLabel>
                <div className="relative">
                  <Input
                    isRequired
                    id="publication"
                    placeholder="Sélectionnez une publication"
                    value={selectedPublicationDisplay}
                    readOnly
                    classNames={{
                      inputWrapper: "bg-page-bg cursor-pointer",
                    }}
                    onClick={() => {
                      // Toggle dropdown
                      const dropdown = document.getElementById('publication-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  />
                  <div
                    id="publication-dropdown"
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden"
                  >
                    {publications.map((pub) => (
                      <div
                        key={pub.id}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedPublication(pub.id);
                          setSelectedPublicationDisplay(`${pub.nom || `Publication ${pub.id}`} - ${new Date(pub.datePublication).toLocaleDateString('fr-FR')}`);
                          // Hide dropdown
                          const dropdown = document.getElementById('publication-dropdown');
                          if (dropdown) {
                            dropdown.classList.add('hidden');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedPublication(pub.id);
                            setSelectedPublicationDisplay(`${pub.nom || `Publication ${pub.id}`} - ${new Date(pub.datePublication).toLocaleDateString('fr-FR')}`);
                            // Hide dropdown
                            const dropdown = document.getElementById('publication-dropdown');
                            if (dropdown) {
                              dropdown.classList.add('hidden');
                            }
                          }
                        }}
                      >
                        {pub.nom || `Publication ${pub.id}`} - {new Date(pub.datePublication).toLocaleDateString('fr-FR')}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}


            {/* Affichage conditionnel des champs de facturation */}
            {selectedClient && selectedPublication && (
              <>
                <FormLabel htmlFor="serviceType" isRequired={true}>
                  Prestation
                </FormLabel>
                <StyledSelect
                  isRequired
                  id="serviceType"
                  placeholder="Sélectionnez une prestation"
                  selectedKeys={newInvoice.serviceType ? new Set([newInvoice.serviceType]) : new Set()}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setNewInvoice((prev) => ({
                      ...prev,
                      serviceType: value || "",
                    }));
                  }}
                >
                  <SelectItem key="Publication">Publication</SelectItem>
                  <SelectItem key="Tournage">Tournage</SelectItem>
                </StyledSelect>

                <FormLabel htmlFor="amount" isRequired={true}>
                  Montant de la facture HT
                </FormLabel>
                <Input
                  isRequired
                  id="amount"
                  placeholder="Ex: 1457.98"
                  step="0.01"
                  type="number"
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  value={newInvoice.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewInvoice((prev) => ({ ...prev, amount: value }));
                  }}
                />

                <FormLabel htmlFor="tournageFacture" isRequired={true}>
                  Statut de la facture
                </FormLabel>
                <div className="relative">
                  <Input
                    isRequired
                    id="tournageFacture"
                    placeholder="Sélectionnez le statut de la facture"
                    value={tournageFactureStatusDisplay}
                    readOnly
                    classNames={{
                      inputWrapper: "bg-page-bg cursor-pointer",
                    }}
                    onClick={() => {
                      // Toggle dropdown
                      const dropdown = document.getElementById('status-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  />
                  <div
                    id="status-dropdown"
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden"
                  >
                    <div
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 flex items-center"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setTournageFactureStatus("En retard");
                        setTournageFactureStatusDisplay("En retard");
                        // Hide dropdown
                        const dropdown = document.getElementById('status-dropdown');
                        if (dropdown) {
                          dropdown.classList.add('hidden');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setTournageFactureStatus("En retard");
                          setTournageFactureStatusDisplay("En retard");
                          // Hide dropdown
                          const dropdown = document.getElementById('status-dropdown');
                          if (dropdown) {
                            dropdown.classList.add('hidden');
                          }
                        }
                      }}
                    >
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-gray-900 dark:text-white font-medium">En retard</span>
                    </div>
                    <div
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 flex items-center"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setTournageFactureStatus("Payée");
                        setTournageFactureStatusDisplay("Payée");
                        // Hide dropdown
                        const dropdown = document.getElementById('status-dropdown');
                        if (dropdown) {
                          dropdown.classList.add('hidden');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setTournageFactureStatus("Payée");
                          setTournageFactureStatusDisplay("Payée");
                          // Hide dropdown
                          const dropdown = document.getElementById('status-dropdown');
                          if (dropdown) {
                            dropdown.classList.add('hidden');
                          }
                        }
                      }}
                    >
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-gray-900 dark:text-white font-medium">Payée</span>
                    </div>
                    <div
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setTournageFactureStatus("En attente");
                        setTournageFactureStatusDisplay("En attente");
                        // Hide dropdown
                        const dropdown = document.getElementById('status-dropdown');
                        if (dropdown) {
                          dropdown.classList.add('hidden');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setTournageFactureStatus("En attente");
                          setTournageFactureStatusDisplay("En attente");
                          // Hide dropdown
                          const dropdown = document.getElementById('status-dropdown');
                          if (dropdown) {
                            dropdown.classList.add('hidden');
                          }
                        }
                      }}
                    >
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-gray-900 dark:text-white font-medium">En attente</span>
                    </div>
                  </div>
                </div>

                 <FormLabel htmlFor="date" isRequired={false}>
                   Date du paiement
                 </FormLabel>
                 <Input
                   id="date"
                   type="date"
                   classNames={{
                     inputWrapper: "bg-page-bg",
                   }}
                   value={newInvoice.date}
                   onChange={(e) => {
                     const value = e.target.value;
                     setNewInvoice((prev) => ({ ...prev, date: value }));
                   }}
                 />

                <FormLabel htmlFor="comment" isRequired={false}>
                  Commentaire
                </FormLabel>
                <Textarea
                  id="comment"
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  placeholder="Commentaires sur la facture..."
                  value={newInvoice.comment}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewInvoice((prev) => ({ ...prev, comment: value }));
                  }}
                />

              </>
            )}

            {/* Message d'instruction si aucun client ou publication n'est sélectionné */}
            {!selectedClient && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium mb-2">
                  Sélectionnez un client pour continuer
                </div>
                <div className="text-sm">
                  Utilisez la recherche ci-dessus pour trouver et sélectionner un client
                </div>
              </div>
            )}
            {selectedClient && !selectedPublication && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium mb-2">
                  Sélectionnez une publication pour continuer
                </div>
                <div className="text-sm">
                  Choisissez la publication concernée par cette facture
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-end">
          <Button
            className="flex-1 border-1"
            color='primary'
            variant="bordered"
            onPress={handleCancel}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            color='primary'
            isDisabled={!newInvoice.establishmentName || !newInvoice.amount || !newInvoice.serviceType || !selectedPublication || !tournageFactureStatus}
            onPress={handleSave}
          >
            {selectedInvoice ? "Modifier" : "Ajouter"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
