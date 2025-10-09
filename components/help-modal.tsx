"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";

import { FormLabel } from "./form-label";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useUser } from "@/contexts/user-context";

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}


export function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const { authFetch } = useAuthFetch();
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    objet: "",
    commentaires: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!formData.objet.trim() || !formData.commentaires.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Récupérer l'ID de la première ville de l'utilisateur
      const premiereVilleId = userProfile?.villes && userProfile.villes.length > 0 
        ? userProfile.villes[0].id 
        : '';

      const ticketData = {
        'Description du problème': formData.objet + ' - ' + formData.commentaires,
        'Ville EPICU': premiereVilleId ? [premiereVilleId] : [],
        'Statut': 'Nouveau',
        'Date de création': new Date().toISOString(),
      };

      const response = await authFetch("/api/help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error('Erreur lors de l\'envoi du ticket');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ objet: "", commentaires: "" });
      setIsSubmitted(false);
      onOpenChange(false);
    }
  };

  return (
    <Modal
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-gray-200 dark:border-gray-700",
        header: "border-b border-gray-200 dark:border-gray-700",
        footer: "border-t border-gray-200 dark:border-gray-700",
      }}
      isOpen={isOpen}
      size="lg"
      className="pb-20 md:pb-0"
      onOpenChange={handleClose}
    >
      <ModalContent>


        <ModalBody className="py-6">
          {isSubmitted ? (
            <div className="text-center py-8  h-50 justify-center items-center flex">
              <div className="text-center">
                <h3 className="text-xl font-bold text-black mb-2">
                  Merci pour ta demande !
                </h3>
                <p className="text-base text-black font-normal">
                  Notre équipe revient vers toi très vite ! 🚀
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <FormLabel htmlFor="objet" isRequired={true}>
                  Objet de la demande
                </FormLabel>
                <Input
                  isRequired
                  id="objet"
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  placeholder="Ex: Accès WordPress, Problème de facturation..."
                  value={formData.objet}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, objet: e.target.value }))
                  }
                />

              </div>

              <div>
                <FormLabel htmlFor="commentaires" isRequired={true}>
                  Commentaires
                </FormLabel>
                <Textarea
                  id="commentaires"
                  maxRows={8}
                  minRows={4}
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  placeholder="Décrivez votre problème en détail..."
                  value={formData.commentaires}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commentaires: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </ModalBody>

        {!isSubmitted && (
          <ModalFooter className="flex justify-end gap-2">
            <Button
              className="flex-1 border-1"
              color='primary'
              disabled={isSubmitting}
              variant="bordered"
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              disabled={!formData.objet.trim() || !formData.commentaires.trim() || isSubmitting}
              isLoading={isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
