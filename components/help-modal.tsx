'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const [formData, setFormData] = useState({
    objet: '',
    commentaires: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!formData.objet.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Reset form after 2 seconds and close modal
        setTimeout(() => {
          setFormData({ objet: '', commentaires: '' });
          setIsSubmitted(false);
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'aide:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ objet: '', commentaires: '' });
      setIsSubmitted(false);
      onOpenChange(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={handleClose}
      size="lg"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-gray-200 dark:border-gray-700",
        header: "border-b border-gray-200 dark:border-gray-700",
        footer: "border-t border-gray-200 dark:border-gray-700",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Demande d'aide
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
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Demande envoyée !
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Votre demande d'aide a été transmise. Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Input
                  label="Objet de la demande"
                  placeholder="Ex: Accès WordPress, Problème de facturation..."
                  value={formData.objet}
                  onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-gray-900 dark:text-gray-100",
                    label: "text-gray-700 dark:text-gray-300",
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  * Champ obligatoire
                </p>
              </div>
              
              <div>
                <Textarea
                  label="Commentaires"
                  placeholder="Décrivez votre problème en détail..."
                  value={formData.commentaires}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                  variant="bordered"
                  minRows={4}
                  maxRows={8}
                  classNames={{
                    input: "text-gray-900 dark:text-gray-100",
                    label: "text-gray-700 dark:text-gray-300",
                  }}
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
              variant="light" 
              onPress={handleClose}
              disabled={isSubmitting}
              className="text-gray-600 dark:text-gray-400"
            >
              Annuler
            </Button>
            <Button 
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={!formData.objet.trim() || isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
