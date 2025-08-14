'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Avatar } from '@heroui/avatar';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    location: string;
    avatar: string;
    category: 'siege' | 'franchise' | 'prestataire';
}

export default function EquipePage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('tout');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                category: selectedCategory,
                search: searchTerm,
                page: '1',
                limit: '35'
            });

            const response = await fetch(`/api/equipe?${params}`);

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des membres de l\'équipe');
            }

            const data = await response.json();
            setMembers(data.members);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [selectedCategory, searchTerm]);



    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    if (loading) {
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

    return (
        <div className="w-full">
            <Card className="w-full">
                <CardBody className="p-6">


                    {/* Onglets de filtrage et recherche sur la même ligne */}
                    <div className="flex justify-between items-center mb-6">
                        <Tabs
                            selectedKey={selectedCategory}
                            onSelectionChange={(key) => handleCategoryChange(key as string)}
                            className="w-full"
                            variant='underlined'
                            classNames={{
                                cursor: "w-[50px] left-[12px] h-1",
                            }}
                        >
                            <Tab key="tout" title="Tout" />
                            <Tab key="siege" title="Siège" />
                            <Tab key="franchise" title="Franchisés" />
                            <Tab key="prestataire" title="Prestataires" />
                        </Tabs>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-64 pr-4 pl-10"
                                    classNames={{
                                        input: "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                                        inputWrapper: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800"
                                    }}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>

                            <Button
                                isIconOnly
                                variant="light"
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <Bars3Icon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Grille des membres de l'équipe */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                        {members.map((member, index) => (
                            <div
                                key={member.id}
                                className="group relative flex flex-col items-center text-center cursor-pointer"
                            >
                                <Avatar
                                    src={member.avatar}
                                    name={member.name}
                                    className="w-16 h-16 mb-3"
                                    classNames={{
                                        base: "ring-2 ring-gray-200 dark:ring-gray-700",
                                        img: "object-cover"
                                    }}
                                />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                                    {member.name}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {member.role} {member.location}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Informations sur le nombre de résultats */}
                    {members.length > 0 && (
                        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Affichage de {members.length} membre(s)
                        </div>
                    )}

                    {/* Message si aucun résultat */}
                    {members.length === 0 && searchTerm && (
                        <div className="text-center py-12">
                            <div className="text-gray-500 dark:text-gray-400">
                                Aucun membre trouvé pour "{searchTerm}"
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
