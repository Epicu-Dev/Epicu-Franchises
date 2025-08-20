'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Tabs, Tab } from '@heroui/tabs';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from '@heroui/table';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/modal';
import { Textarea } from '@heroui/input';
import {
    PlusIcon,
    PlayIcon,
    TrophyIcon,
    ClockIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

interface Tirage {
    id: string;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    datetirage: string;
    statut: 'en_cours' | 'termine' | 'programme' | 'annule';
    participants: Participant[];
    gagnant?: Participant;
    prix: string;
    conditions: string;
    categorie: string;
}

interface Participant {
    id: string;
    nom: string;
    email: string;
    telephone?: string;
    dateInscription: string;
    statut: 'inscrit' | 'gagnant' | 'elimine';
}

export default function TiragePage() {


    return (
        <div>
            <h1>Tirage</h1>
        </div>
    );
}
