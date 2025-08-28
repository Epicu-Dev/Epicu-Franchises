"use client";

import { useState, useEffect } from "react";
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

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const [formData, setFormData] = useState({
    objet: "",
    commentaires: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Récupérer le profil utilisateur au chargement
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profil?section=profile");

        if (response.ok) {
          const profile = await response.json();

          setUserProfile(profile);
        }
      } catch (error) {
        
      }
    };

    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.objet.trim() || !userProfile) {
      return;
    }

    setIsSubmitting(true);

    try {
      const emailData = {
        objet: formData.objet,
        commentaires: formData.commentaires,
        expediteur: userProfile.email,
        destinataire: "webmaster@epicu.fr",
      };

      const response = await fetch("/api/help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
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
                  placeholder="Ex: Accès WordPress, Problème de facturation..."
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
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
                  placeholder="Décrivez votre problème en détail..."
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  value={formData.commentaires}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commentaires: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Optionnel - Plus de détails nous aident à mieux vous assister
                </p>
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
              disabled={!formData.objet.trim() || isSubmitting || !userProfile}
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
