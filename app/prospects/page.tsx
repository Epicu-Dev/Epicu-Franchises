'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Pagination } from '@heroui/pagination';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Textarea } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

interface Prospect {
  id: string;
  nomEtablissement: string;
  categorie1: string;
  categorie2: string;
  dateRelance: string;
  suiviPar: string;
  commentaire: string;
  statut: 'a_contacter' | 'en_discussion' | 'glacial';
  email?: string;
  telephone?: string;
  adresse?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSuiviPar, setSelectedSuiviPar] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedTab, setSelectedTab] = useState('a_contacter');
  const [newProspect, setNewProspect] = useState({
    nomEtablissement: '',
    categorie1: '',
    categorie2: '',
    email: '',
    telephone: '',
    adresse: '',
    commentaire: '',
    suiviPar: '',
    statut: 'a_contacter' as 'a_contacter' | 'en_discussion' | 'glacial'
  });

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        suiviPar: selectedSuiviPar,
        statut: selectedTab,
        sortBy: sortField,
        sortOrder: sortDirection
      });

      const response = await fetch(`/api/prospects?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prospects');
      }

      const data = await response.json();
      setProspects(data.prospects);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [pagination.currentPage, searchTerm, selectedCategory, selectedSuiviPar, selectedTab, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddProspect = async () => {
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProspect),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du prospect');
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewProspect({
        nomEtablissement: '',
        categorie1: '',
        categorie2: '',
        email: '',
        telephone: '',
        adresse: '',
        commentaire: '',
        suiviPar: '',
        statut: 'a_contacter' as 'a_contacter' | 'en_discussion' | 'glacial'
      });
      setIsAddModalOpen(false);

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setIsEditModalOpen(true);
  };

  const handleUpdateProspect = async () => {
    if (!editingProspect) return;

    try {
      const response = await fetch(`/api/prospects/${editingProspect.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProspect),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification du prospect');
      }

      // Fermer le modal et recharger les prospects
      setIsEditModalOpen(false);
      setEditingProspect(null);
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleConvertToClient = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la conversion en client');
      }

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-orange-100 text-orange-800';
      case 'shop':
        return 'bg-purple-100 text-purple-800';
      case 'service':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && prospects.length === 0) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" className="text-black dark:text-white" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardBody className="p-6">
          {/* Tabs */}
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="mb-6"
            variant='underlined'
            classNames={{
              cursor: "w-[50px] left-[12px] h-1",
            }}
          >
            <Tab key="a_contacter" title="À contacter" />
            <Tab key="en_discussion" title="En discussion" />
            <Tab key="glacial" title="Glacial" />
          </Tabs>

          {/* Header with filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select
                placeholder="Catégorie"
                className="w-48"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="food">Food</SelectItem>
                <SelectItem key="shop">Shop</SelectItem>
                <SelectItem key="service">Service</SelectItem>
              </Select>

              <Select
                placeholder="Suivi par"
                className="w-48"
                selectedKeys={selectedSuiviPar ? [selectedSuiviPar] : []}
                onSelectionChange={(keys) => setSelectedSuiviPar(Array.from(keys)[0] as string)}
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="nom">Nom</SelectItem>
                <SelectItem key="prenom">Prénom</SelectItem>
              </Select>

              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsAddModalOpen(true)}
              >
                Ajouter un prospect
              </Button>
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pr-4 pl-10"
                classNames={{
                  input: "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                  inputWrapper: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800"
                }}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Table */}
          <Table aria-label="Tableau des prospects">
            <TableHeader>
              <TableColumn>Nom établissement</TableColumn>
              <TableColumn>
                <Button
                  variant="light"
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  onPress={() => handleSort('categorie1')}
                >
                  Catégorie
                  {sortField === 'categorie1' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  variant="light"
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  onPress={() => handleSort('categorie2')}
                >
                  Catégorie
                  {sortField === 'categorie2' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  variant="light"
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  onPress={() => handleSort('dateRelance')}
                >
                  Date de relance
                  {sortField === 'dateRelance' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  variant="light"
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  onPress={() => handleSort('suiviPar')}
                >
                  Suivi par
                  {sortField === 'suiviPar' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Commentaire</TableColumn>
              <TableColumn>Modifier</TableColumn>
              <TableColumn>Basculer en client</TableColumn>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">{prospect.nomEtablissement}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadgeColor(prospect.categorie1)}`}>
                      {prospect.categorie1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadgeColor(prospect.categorie2)}`}>
                      {prospect.categorie2}
                    </span>
                  </TableCell>
                  <TableCell>{prospect.dateRelance}</TableCell>
                  <TableCell>{prospect.suiviPar}</TableCell>
                  <TableCell>{prospect.commentaire}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800"
                      onPress={() => handleEditProspect(prospect)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onPress={() => handleConvertToClient(prospect.id)}
                    >
                      Convertir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <Pagination
              total={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
              showControls
              classNames={{
                wrapper: "gap-2",
                item: "w-8 h-8 text-sm",
                cursor: "bg-black text-white dark:bg-white dark:text-black font-bold"
              }}
            />
          </div>

          {/* Info sur le nombre total d'éléments */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Affichage de {prospects.length} prospect(s) sur {pagination.totalItems} au total
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout de prospect */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>Ajouter un nouveau prospect</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom établissement"
                placeholder="Nom de l'établissement"
                value={newProspect.nomEtablissement}
                onChange={(e) => setNewProspect(prev => ({ ...prev, nomEtablissement: e.target.value }))}
                isRequired
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Catégorie 1"
                  selectedKeys={[newProspect.categorie1]}
                  onSelectionChange={(keys) => setNewProspect(prev => ({ ...prev, categorie1: Array.from(keys)[0] as string }))}
                >
                  <SelectItem key="food">Food</SelectItem>
                  <SelectItem key="shop">Shop</SelectItem>
                  <SelectItem key="service">Service</SelectItem>
                </Select>
                <Select
                  label="Catégorie 2"
                  selectedKeys={[newProspect.categorie2]}
                  onSelectionChange={(keys) => setNewProspect(prev => ({ ...prev, categorie2: Array.from(keys)[0] as string }))}
                >
                  <SelectItem key="food">Food</SelectItem>
                  <SelectItem key="shop">Shop</SelectItem>
                  <SelectItem key="service">Service</SelectItem>
                </Select>
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="contact@etablissement.fr"
                value={newProspect.email}
                onChange={(e) => setNewProspect(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="Téléphone"
                placeholder="01 23 45 67 89"
                value={newProspect.telephone}
                onChange={(e) => setNewProspect(prev => ({ ...prev, telephone: e.target.value }))}
              />
              <Input
                label="Adresse"
                placeholder="123 Rue de l'établissement, 75001 Paris"
                value={newProspect.adresse}
                onChange={(e) => setNewProspect(prev => ({ ...prev, adresse: e.target.value }))}
              />
              <Select
                label="Suivi par"
                selectedKeys={[newProspect.suiviPar]}
                onSelectionChange={(keys) => setNewProspect(prev => ({ ...prev, suiviPar: Array.from(keys)[0] as string }))}
              >
                <SelectItem key="nom">Nom</SelectItem>
                <SelectItem key="prenom">Prénom</SelectItem>
              </Select>
              <Select
                label="Statut"
                selectedKeys={[newProspect.statut]}
                onSelectionChange={(keys) => setNewProspect(prev => ({ ...prev, statut: Array.from(keys)[0] as 'a_contacter' | 'en_discussion' | 'glacial' }))}
              >
                <SelectItem key="a_contacter">À contacter</SelectItem>
                <SelectItem key="en_discussion">En discussion</SelectItem>
                <SelectItem key="glacial">Glacial</SelectItem>
              </Select>
              <Textarea
                label="Commentaire"
                placeholder="Informations supplémentaires..."
                value={newProspect.commentaire}
                onChange={(e) => setNewProspect(prev => ({ ...prev, commentaire: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" onPress={handleAddProspect}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification de prospect */}
      <Modal 
        isOpen={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen}
        scrollBehavior="inside"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2>Modifier le prospect</h2>
            <p className="text-sm text-gray-500 font-normal">
              {editingProspect?.nomEtablissement}
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            {editingProspect && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Informations générales
                  </h3>
                  
                  <Input
                    label="Nom établissement"
                    placeholder="Nom de l'établissement"
                    value={editingProspect.nomEtablissement}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, nomEtablissement: e.target.value }) : null)}
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm"
                    }}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Catégorie 1"
                      placeholder="Sélectionner une catégorie"
                      selectedKeys={editingProspect.categorie1 ? [editingProspect.categorie1] : []}
                      onSelectionChange={(keys) => setEditingProspect(prev => prev ? ({ ...prev, categorie1: Array.from(keys)[0] as string }) : null)}
                      classNames={{
                        label: "text-sm font-medium"
                      }}
                    >
                      <SelectItem key="food">Food</SelectItem>
                      <SelectItem key="shop">Shop</SelectItem>
                      <SelectItem key="service">Service</SelectItem>
                    </Select>
                    
                    <Select
                      label="Catégorie 2"
                      placeholder="Sélectionner une catégorie"
                      selectedKeys={editingProspect.categorie2 ? [editingProspect.categorie2] : []}
                      onSelectionChange={(keys) => setEditingProspect(prev => prev ? ({ ...prev, categorie2: Array.from(keys)[0] as string }) : null)}
                      classNames={{
                        label: "text-sm font-medium"
                      }}
                    >
                      <SelectItem key="food">Food</SelectItem>
                      <SelectItem key="shop">Shop</SelectItem>
                      <SelectItem key="service">Service</SelectItem>
                    </Select>
                  </div>
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="contact@etablissement.fr"
                    value={editingProspect.email || ''}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm"
                    }}
                  />
                  
                  <Input
                    label="Téléphone"
                    placeholder="01 23 45 67 89"
                    value={editingProspect.telephone || ''}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, telephone: e.target.value }) : null)}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm"
                    }}
                  />
                  
                  <Input
                    label="Adresse"
                    placeholder="123 Rue de l'établissement, 75001 Paris"
                    value={editingProspect.adresse || ''}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, adresse: e.target.value }) : null)}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm"
                    }}
                  />
                </div>

                {/* Suivi */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Suivi
                  </h3>
                  
                  <Input
                    label="Date de relance"
                    type="date"
                    value={editingProspect.dateRelance || ''}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, dateRelance: e.target.value }) : null)}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm"
                    }}
                  />
                  
                  <Select
                    label="Suivi par"
                    placeholder="Sélectionner une personne"
                    selectedKeys={editingProspect.suiviPar ? [editingProspect.suiviPar] : []}
                    onSelectionChange={(keys) => setEditingProspect(prev => prev ? ({ ...prev, suiviPar: Array.from(keys)[0] as string }) : null)}
                    classNames={{
                      label: "text-sm font-medium"
                    }}
                  >
                    <SelectItem key="nom">Nom</SelectItem>
                    <SelectItem key="prenom">Prénom</SelectItem>
                  </Select>
                  
                  <Select
                    label="Statut"
                    placeholder="Sélectionner un statut"
                    selectedKeys={editingProspect.statut ? [editingProspect.statut] : []}
                    onSelectionChange={(keys) => setEditingProspect(prev => prev ? ({ ...prev, statut: Array.from(keys)[0] as 'a_contacter' | 'en_discussion' | 'glacial' }) : null)}
                    classNames={{
                      label: "text-sm font-medium"
                    }}
                  >
                    <SelectItem key="a_contacter">À contacter</SelectItem>
                    <SelectItem key="en_discussion">En discussion</SelectItem>
                    <SelectItem key="glacial">Glacial</SelectItem>
                  </Select>
                </div>

                {/* Commentaire */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Commentaire
                  </h3>
                  
                  <Textarea
                    placeholder="Informations supplémentaires..."
                    value={editingProspect.commentaire || ''}
                    onChange={(e) => setEditingProspect(prev => prev ? ({ ...prev, commentaire: e.target.value }) : null)}
                    minRows={4}
                    classNames={{
                      input: "text-sm"
                    }}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => {
                setIsEditModalOpen(false);
                setEditingProspect(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" 
              onPress={handleUpdateProspect}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 