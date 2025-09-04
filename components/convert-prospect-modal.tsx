"use client";

import { useState } from "react";
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

import { FormLabel } from "@/components";
import { StyledSelect } from "@/components/styled-select";
import { Prospect } from "@/types/prospect";

type ProspectStatus = "A contacter" | "En discussion" | "Glacial" | "Client";

interface ConvertProspectModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    prospect: Prospect | null;
    // Props pour la conversion en client
    editingClient?: any;
    setEditingClient?: React.Dispatch<React.SetStateAction<any>>;
    onUpdateClient?: () => Promise<void>;
    // Props pour la mise à jour du statut
    status?: ProspectStatus | null;
    setStatus?: React.Dispatch<React.SetStateAction<ProspectStatus | null>>;
    comment?: string;
    setComment?: React.Dispatch<React.SetStateAction<string>>;
    onUpdateProspect?: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function ConvertProspectModal({
    isOpen,
    onOpenChange,
    prospect,
    editingClient: _editingClient,
    setEditingClient: _setEditingClient,
    onUpdateClient,
    status,
    setStatus,
    comment,
    setComment,
    onUpdateProspect,
    isLoading,
    error
}: ConvertProspectModalProps) {
    // États locaux pour la conversion en client (si les props ne sont pas fournies)
    const [localStatus, setLocalStatus] = useState<ProspectStatus | null>(null);
    const [localComment, setLocalComment] = useState<string>("");

    // Utiliser les props si fournies, sinon les états locaux
    const currentStatus = status !== undefined ? status : localStatus;
    const currentComment = comment !== undefined ? comment : localComment;
    const currentSetStatus = setStatus || setLocalStatus;
    const currentSetComment = setComment || setLocalComment;

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                <ModalHeader className="flex justify-center">
                    Modifier le statut du prospect
                </ModalHeader>

                <ModalBody className="max-h-[70vh] overflow-y-auto">
                    {prospect && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <FormLabel htmlFor="status" isRequired={true}>
                                    Statut
                                </FormLabel>
                                <StyledSelect
                                    isRequired
                                    id="status"
                                    placeholder="Sélectionner un statut"
                                    selectedKeys={currentStatus ? [currentStatus] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedStatus = Array.from(keys)[0] as ProspectStatus;

                                        currentSetStatus(selectedStatus);
                                    }}
                                >
                                    <SelectItem key="A contacter">A contacter</SelectItem>
                                    <SelectItem key="En discussion">En discussion</SelectItem>
                                    <SelectItem key="Glacial">Glacial</SelectItem>
                                    <SelectItem key="Client">Client</SelectItem>
                                </StyledSelect>

                                <FormLabel htmlFor="comment" isRequired={false}>
                                    Commentaire
                                </FormLabel>
                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="comment"
                                    minRows={4}
                                    placeholder="Ajouter un commentaire..."
                                    value={currentComment}
                                    onChange={(e) => currentSetComment(e.target.value)}
                                />
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
                                currentSetStatus(null);
                                currentSetComment("");
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            color='primary'
                            isDisabled={isLoading}
                            isLoading={isLoading}
                            onPress={onUpdateClient || onUpdateProspect}
                        >
                            {isLoading ? 'Chargement...' : 'Modifier'}
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
