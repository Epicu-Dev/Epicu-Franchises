"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

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
        console.error("Erreur lors de la récupération du profil:", error);
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
        // Reset form after 3 seconds and close modal
        setTimeout(() => {
          setFormData({ objet: "", commentaires: "" });
          setIsSubmitted(false);
          onOpenChange(false);
        }, 3000);
      }
    } catch (error) {
      console.error(
        "Erreur lors de l&apos;envoi de la demande d&apos;aide:",
        error
      );
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
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Demande d&apos;aide
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                Décrivez votre problème ou votre question
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-black mb-2">
                    Merci pour ta demande !
                  </h3>
                  <p className="text-base text-black font-normal">
                    Notre équipe revient vers toi très vite ! 🚀
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Input
                  isRequired
                  classNames={{
                    input: "text-gray-900 dark:text-gray-100",
                    label: "text-gray-700 dark:text-gray-300",
                  }}
                  label="Objet de la demande"
                  placeholder="Ex: Accès WordPress, Problème de facturation..."
                  value={formData.objet}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, objet: e.target.value }))
                  }
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  * Champ obligatoire
                </p>
              </div>

              <div>
                <Textarea
                  classNames={{
                    input: "text-gray-900 dark:text-gray-100",
                    label: "text-gray-700 dark:text-gray-300",
                  }}
                  label="Commentaires"
                  maxRows={8}
                  minRows={4}
                  placeholder="Décrivez votre problème en détail..."
                  value={formData.commentaires}
                  variant="bordered"
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
          <ModalFooter>
            <Button
              className="text-gray-600 dark:text-gray-400"
              disabled={isSubmitting}
              variant="light"
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
