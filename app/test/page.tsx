"use client";
import { useState, useEffect } from 'react';

type Prospect = {
    nomEtablissement: string;
    categorie: string;
    ville: string;
    suiviPar?: string;
    commentaires?: string;
    dateRelance?: string;
};

export default function TestProspects() {
    const [lostProspects, setLostProspects] = useState<Prospect[]>([]);
    const [lostViewCount, setLostViewCount] = useState<number | null>(null);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [prospectsViewCount, setProspectsViewCount] = useState<number | null>(null);
    const [discussions, setDiscussions] = useState<Prospect[]>([]);
    const [discussionsViewCount, setDiscussionsViewCount] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/prospects/lost').then(res => res.json()),
            fetch('/api/prospects/prospects').then(res => res.json()),
            fetch('/api/prospects/discussion').then(res => res.json()),
        ])
        .then(([lostData, prospectsData, discussionData]) => {
            setLostProspects(lostData.prospects || []);
            setLostViewCount(lostData.viewCount ?? null);
            setProspects(prospectsData.prospects || []);
            setProspectsViewCount(prospectsData.viewCount ?? null);
            setDiscussions(discussionData.discussions || []);
            setDiscussionsViewCount(discussionData.viewCount ?? null);
            setLoading(false);
        })
        .catch(() => {
            setError('Erreur lors du chargement');
            setLoading(false);
        });
    }, []);

    const runSearch = async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/prospects/discussion?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            setDiscussions(data.discussions || []);
            setDiscussionsViewCount(data.viewCount ?? null);
        } catch (e) {
            setError('Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const runLostSearch = async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/prospects/lost?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            setLostProspects(data.prospects || []);
            setLostViewCount(data.viewCount ?? null);
        } catch (e) {
            setError('Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const runProspectsSearch = async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/prospects/prospects?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            setProspects(data.prospects || []);
            setProspectsViewCount(data.viewCount ?? null);
        } catch (e) {
            setError('Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const renderTable = (data: Prospect[], viewCount: number | null, title: string) => (
        <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            {viewCount !== null && (
                <div className="mb-2 text-gray-700">Nombre total d&apos;éléments dans la vue : <span className="font-semibold">{viewCount}</span></div>
            )}
            <table className="min-w-full border">
                <thead>
                    <tr>
                        <th className="border px-2 py-1">Nom établissement</th>
                        <th className="border px-2 py-1">Catégorie</th>
                        <th className="border px-2 py-1">Ville</th>
                        <th className="border px-2 py-1">Suivi par...</th>
                        <th className="border px-2 py-1">Commentaires</th>
                        <th className="border px-2 py-1">Date de relance</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((p, idx) => (
                        <tr key={idx}>
                            <td className="border px-2 py-1">{p.nomEtablissement}</td>
                            <td className="border px-2 py-1">{p.categorie}</td>
                            <td className="border px-2 py-1">{p.ville}</td>
                            <td className="border px-2 py-1">{p.suiviPar || '-'}</td>
                            <td className="border px-2 py-1">{p.commentaires || '-'}</td>
                            <td className="border px-2 py-1">{p.dateRelance || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Prospects</h1>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && (
                <>
                    <section className="mb-8">
                        <div className="mb-2 flex items-center gap-2">
                            <input
                                className="border px-2 py-1 rounded"
                                placeholder="Rechercher Perdus: nom, ville ou commentaire"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={() => runLostSearch(searchQuery)}
                            >
                                Rechercher
                            </button>
                            <button
                                className="bg-gray-200 px-3 py-1 rounded"
                                onClick={() => { setSearchQuery(''); runLostSearch(''); }}
                            >
                                Réinitialiser
                            </button>
                        </div>
                        {renderTable(lostProspects, lostViewCount, 'Prospects Perdus')}
                    </section>
                    <section className="mb-8">
                        <div className="mb-2 flex items-center gap-2">
                            <input
                                className="border px-2 py-1 rounded"
                                placeholder="Rechercher Prospects: nom, ville ou commentaire"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={() => runProspectsSearch(searchQuery)}
                            >
                                Rechercher
                            </button>
                            <button
                                className="bg-gray-200 px-3 py-1 rounded"
                                onClick={() => { setSearchQuery(''); runProspectsSearch(''); }}
                            >
                                Réinitialiser
                            </button>
                        </div>
                        {renderTable(prospects, prospectsViewCount, 'Prospects')}
                    </section>
                    <section className="mb-8">
                        <div className="mb-2 flex items-center gap-2">
                            <input
                                className="border px-2 py-1 rounded"
                                placeholder="Rechercher nom, ville ou commentaire"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={() => runSearch(searchQuery)}
                            >
                                Rechercher
                            </button>
                            <button
                                className="bg-gray-200 px-3 py-1 rounded"
                                onClick={() => { setSearchQuery(''); runSearch(''); }}
                            >
                                Réinitialiser
                            </button>
                        </div>
                        {renderTable(discussions, discussionsViewCount, 'En Discussion')}
                    </section>
                </>
            )}
        </main>
    );
}