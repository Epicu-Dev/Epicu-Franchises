"use client";

import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Switch } from "@heroui/switch";

import { FormLabel } from "@/components";
import { StyledSelect } from "@/components/styled-select";
import { Client } from "@/types/client";

interface ClientModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingClient: Client | null;
    setEditingClient: React.Dispatch<React.SetStateAction<Client | null>>;
    categories: Array<{ id: string, name: string }>;
    onUpdateClient: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function ClientModal({
    isOpen,
    onOpenChange,
    editingClient,
    setEditingClient,
    categories,
    onUpdateClient,
    isLoading,
    error
}: ClientModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                <ModalHeader className="flex justify-center">
                    Modifier le client
                </ModalHeader>

                <ModalBody className="max-h-[70vh] overflow-y-auto">
                    {editingClient && (
                        <div className="space-y-6">
                            {/* Informations générales */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Informations générales
                                </h3>

                                <FormLabel htmlFor="nomEtablissement" isRequired={true}>
                                    Nom établissement
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="nomEtablissement"
                                    placeholder="Nom de l'établissement"
                                    value={editingClient.nomEtablissement}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, nomEtablissement: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="ville" isRequired={true}>
                                    Ville
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="ville"
                                    placeholder="Paris"
                                    value={editingClient.ville || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, ville: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="categorie" isRequired={true}>
                                    Catégorie
                                </FormLabel>
                                <StyledSelect
                                    isRequired
                                    id="categorie"
                                    placeholder="Sélectionner une catégorie"
                                    selectedKeys={
                                        editingClient.categorie ? [editingClient.categorie] : []
                                    }
                                    onSelectionChange={(keys) =>
                                        setEditingClient(
                                            editingClient
                                                ? {
                                                    ...editingClient,
                                                    categorie: Array.from(keys)[0] as string,
                                                }
                                                : null
                                        )
                                    }
                                >
                                    {categories.length > 0 ? (
                                        categories.map((category) => (
                                            <SelectItem key={category.name}>
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem key="loading">Chargement...</SelectItem>
                                    )}
                                </StyledSelect>

                                <FormLabel htmlFor="telephone" isRequired={true}>
                                    Téléphone
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="telephone"
                                    placeholder="01 23 45 67 89"
                                    value={editingClient.telephone || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, telephone: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="email" isRequired={true}>
                                    Mail
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="email"
                                    placeholder="contact@etablissement.fr"
                                    type="email"
                                    value={editingClient.email || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, email: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="numeroSiret" isRequired={true}>
                                    Numéro de SIRET
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="numeroSiret"
                                    placeholder="12345678901234"
                                    value={editingClient.siret || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, siret: e.target.value } : null
                                        )
                                    }
                                />
                            </div>

                            {/* Commentaire */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="commentaire" isRequired={false}>
                                    Commentaire
                                </FormLabel>

                                <Textarea
                                    classNames={{
                                        input: "text-sm",
                                    }}
                                    minRows={3}
                                    placeholder="..."
                                    value={editingClient.commentaire || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, commentaire: e.target.value } : null
                                        )
                                    }
                                />
                            </div>

                            {/* Prestations */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Prestations
                                </h3>

                                <FormLabel htmlFor="dateSignatureContrat" isRequired={true}>
                                    Date de signature du contrat
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="dateSignatureContrat"
                                    type="date"
                                    value={editingClient.dateSignatureContrat || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, dateSignatureContrat: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <Button
                                    color='primary'
                                    endContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                >
                                    Télécharger
                                </Button>

                                <FormLabel htmlFor="datePublicationContenu" isRequired={true}>
                                    Date de publication
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="datePublicationContenu"
                                    type="date"
                                    value={editingClient.datePublicationContenu || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, datePublicationContenu: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="datePublicationFacture" isRequired={true}>
                                    Date d&apos;envoie facture création de contenu
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="datePublicationFacture"
                                    type="date"
                                    value={editingClient.datePublicationFacture || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, datePublicationFacture: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="statutPaiementContenu" isRequired={true}>
                                    Statut du paiement
                                </FormLabel>
                                <StyledSelect
                                    id="statutPaiementContenu"
                                    selectedKeys={
                                        editingClient.statutPaiementContenu
                                            ? [editingClient.statutPaiementContenu]
                                            : []
                                    }
                                    onSelectionChange={(keys) =>
                                        setEditingClient(
                                            editingClient
                                                ? {
                                                    ...editingClient,
                                                    statutPaiementContenu: Array.from(keys)[0] as
                                                        | "Payée"
                                                        | "En attente"
                                                        | "En retard",
                                                }
                                                : null
                                        )
                                    }
                                >
                                    <SelectItem key="Payée">Payée</SelectItem>
                                    <SelectItem key="En attente">En attente</SelectItem>
                                    <SelectItem key="En retard">En retard</SelectItem>
                                </StyledSelect>

                                <FormLabel htmlFor="montantFactureContenu" isRequired={true}>
                                    Montant facturé
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantFactureContenu"
                                    placeholder="1750€"
                                    value={editingClient.montantFactureContenu || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, montantFactureContenu: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="montantPaye" isRequired={true}>
                                    Montant payé
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantPaye"
                                    placeholder="750€"
                                    value={editingClient.montantPaye || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, montantPaye: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="dateReglementFacture" isRequired={true}>
                                    Date du règlement de la facture
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="dateReglementFacture"
                                    type="date"
                                    value={editingClient.dateReglementFacture || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, dateReglementFacture: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="restantDu" isRequired={true}>
                                    Restant dû
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="restantDu"
                                    placeholder="1750€"
                                    value={editingClient.restantDu || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, restantDu: e.target.value } : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="montantSponsorisation" isRequired={true}>
                                    Montant de la sponsorisation
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantSponsorisation"
                                    placeholder="1750€"
                                    value={editingClient.montantSponsorisation || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, montantSponsorisation: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="montantAddition" isRequired={true}>
                                    Montant de l&apos;addition
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantAddition"
                                    placeholder="1750€"
                                    value={editingClient.montantAddition || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, montantAddition: e.target.value }
                                                : null
                                        )
                                    }
                                />
                            </div>

                            {/* Commentaire */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="commentaire" isRequired={false}>
                                    Commentaire
                                </FormLabel>

                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="commentaire"
                                    minRows={4}
                                    placeholder="..."
                                    value={editingClient.commentaire || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, commentaire: e.target.value } : null
                                        )
                                    }
                                />
                            </div>

                            {/* Cadeau du gérant pour le jeu concours */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="commentaireCadeauGerant" isRequired={false}>
                                    Cadeau du gérant pour le jeu concours
                                </FormLabel>
                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="commentaireCadeauGerant"
                                    minRows={4}
                                    placeholder="..."
                                    value={editingClient.commentaireCadeauGerant || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient
                                                ? { ...editingClient, commentaireCadeauGerant: e.target.value }
                                                : null
                                        )
                                    }
                                />

                                <FormLabel htmlFor="montantCadeau" isRequired={true}>
                                    Montant du cadeau
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantCadeau"
                                    placeholder="150€"
                                    value={editingClient.montantCadeau || ""}
                                    onChange={(e) =>
                                        setEditingClient(
                                            editingClient ? { ...editingClient, montantCadeau: e.target.value } : null
                                        )
                                    }
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-base ">Tirage au sort effectué</span>
                                    <Switch
                                        isSelected={editingClient.tirageAuSort}
                                        onValueChange={(checked) =>
                                            setEditingClient(
                                                editingClient ? { ...editingClient, tirageAuSort: checked } : null
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="flex flex-col gap-3">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center w-full">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    <div className="flex justify-between gap-3">
                        <Button
                            className="flex-1 border-1"
                            color='primary'
                            isDisabled={isLoading}
                            variant="bordered"
                            onPress={() => {
                                onOpenChange(false);
                                setEditingClient(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            color='primary'
                            isDisabled={isLoading}
                            isLoading={isLoading}
                            onPress={onUpdateClient}
                        >
                            {isLoading ? 'Chargement...' : (editingClient?.id ? 'Modifier' : 'Ajouter')}
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
