"use client";
import { useState } from 'react';

type Prospect = {
    nomEtablissement: string;
    categorie: string;
    ville?: string;
    suiviPar?: string;
    commentaires?: string;
    dateRelance?: string;
};

type Client = {
    categorie: string;
    nomEtablissement: string;
    raisonSociale?: string;
    dateSignature?: string;
    commentaire?: string;
};

export default function TestProspects() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lostProspects, setLostProspects] = useState<Prospect[]>([]);
    const [lostViewCount, setLostViewCount] = useState<number | null>(null);

    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [prospectsViewCount, setProspectsViewCount] = useState<number | null>(null);

    const [discussions, setDiscussions] = useState<Prospect[]>([]);
    const [discussionsViewCount, setDiscussionsViewCount] = useState<number | null>(null);

    const [clients, setClients] = useState<Client[]>([]);
    const [clientsViewCount, setClientsViewCount] = useState<number | null>(null);
    const [villes, setVilles] = useState<{ id: string; ville: string }[]>([]);
    const [villesCount, setVillesCount] = useState<number | null>(null);

    const [selected, setSelected] = useState<string | null>(null);

    const loadCollection = async (col: string, q = '') => {
        setLoading(true);
        setError(null);
        setSelected(col);
        try {
            let url = '';

            switch (col) {
                case 'lost':
                    url = `/api/prospects/glacial${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                    {
                        const res = await fetch(url);
                        const data = await res.json();

                        setLostProspects(data.prospects || []);
                        setLostViewCount(data.viewCount ?? null);
                    }
                    break;
                case 'prospects':
                    url = `/api/prospects/prospects${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                    {
                        const res = await fetch(url);
                        const data = await res.json();

                        setProspects(data.prospects || []);
                        setProspectsViewCount(data.viewCount ?? null);
                    }
                    break;
                case 'discussion':
                    url = `/api/prospects/discussion${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                    {
                        const res = await fetch(url);
                        const data = await res.json();

                        setDiscussions(data.discussions || []);
                        setDiscussionsViewCount(data.viewCount ?? null);
                    }
                    break;
                case 'clients':
                    url = `/api/clients/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                    {
                        const res = await fetch(url);
                        const data = await res.json();

                        setClients(data.clients || []);
                        setClientsViewCount(data.viewCount ?? null);
                    }
                    break;
                case 'villes':
                    url = `/api/villes${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                    {
                        const res = await fetch(url);
                        const data = await res.json();
                        setVilles(data.results || []);
                        setVillesCount(data.count ?? null);
                    }
                    break;
                default:
                    break;
            }
        } catch (e) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const renderProspectTable = (data: Prospect[], viewCount: number | null, title: string) => (
        <div>
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
                            <td className="border px-2 py-1">{p.ville || '-'}</td>
                            <td className="border px-2 py-1">{p.suiviPar || '-'}</td>
                            <td className="border px-2 py-1">{p.commentaires || '-'}</td>
                            <td className="border px-2 py-1">{p.dateRelance || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderClientsTable = (data: Client[], viewCount: number | null) => (
        <div>
            <h2 className="text-xl font-semibold mb-2">Clients</h2>
            {viewCount !== null && (
                <div className="mb-2 text-gray-700">Nombre total de clients: <span className="font-semibold">{viewCount}</span></div>
            )}
            <table className="min-w-full border">
                <thead>
                    <tr>
                        <th className="border px-2 py-1">Nom établissement</th>
                        <th className="border px-2 py-1">Catégorie</th>
                        <th className="border px-2 py-1">Raison sociale</th>
                        <th className="border px-2 py-1">Date signature</th>
                        <th className="border px-2 py-1">Commentaire</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((c, idx) => (
                        <tr key={idx}>
                            <td className="border px-2 py-1">{c.nomEtablissement}</td>
                            <td className="border px-2 py-1">{c.categorie}</td>
                            <td className="border px-2 py-1">{c.raisonSociale || '-'}</td>
                            <td className="border px-2 py-1">{c.dateSignature || '-'}</td>
                            <td className="border px-2 py-1">{c.commentaire || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Prospects</h1>
            <div className="flex gap-6">
                <aside className="w-1/4 border p-4">
                    <h3 className="font-semibold mb-2">Collections</h3>
                    <ul className="flex flex-col gap-2">
                        <li>
                            <button className={`w-full text-left px-2 py-1 rounded ${selected === 'glacial' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('glacial')}>
                                Prospects Glaciaux
                            </button>
                        </li>
                        <li>
                            <button className={`w-full text-left px-2 py-1 rounded ${selected === 'prospects' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('prospects')}>
                                Prospects
                            </button>
                        </li>
                        <li>
                            <button className={`w-full text-left px-2 py-1 rounded ${selected === 'discussion' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('discussion')}>
                                En Discussion
                            </button>
                        </li>
                        <li>
                            <button className={`w-full text-left px-2 py-1 rounded ${selected === 'villes' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('villes')}>
                                Villes Epicu
                            </button>
                        </li>
                        <li>
                            <button className={`w-full text-left px-2 py-1 rounded ${selected === 'clients' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('clients')}>
                                Clients
                            </button>
                        </li>
                    </ul>
                    <div className="mt-4">
                            <input
                                className="w-full border px-2 py-1 rounded"
                                placeholder="Rechercher..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && selected) loadCollection(selected, searchQuery); }}
                            />
                        <div className="mt-2 flex gap-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => selected && loadCollection(selected, searchQuery)}>Rechercher</button>
                            <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => { setSearchQuery(''); }}>Réinitialiser</button>
                        </div>
                    </div>
                </aside>
                <section className="flex-1 border p-4">
                    {loading && <div>Chargement...</div>}
                    {error && <div className="text-red-500">{error}</div>}
                    {!loading && !error && selected === null && (
                        <div>Sélectionnez une collection à gauche pour afficher les résultats.</div>
                    )}
                    {!loading && !error && selected === 'glacial' && renderProspectTable(lostProspects, lostViewCount, 'Prospects Glaciaux')}
                    {!loading && !error && selected === 'prospects' && renderProspectTable(prospects, prospectsViewCount, 'Prospects')}
                    {!loading && !error && selected === 'discussion' && renderProspectTable(discussions, discussionsViewCount, 'En Discussion')}
                    {!loading && !error && selected === 'clients' && renderClientsTable(clients, clientsViewCount)}
                    {!loading && !error && selected === 'villes' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Villes Epicu</h2>
                            {villesCount !== null && (
                                <div className="mb-2 text-gray-700">Nombre de résultats: <span className="font-semibold">{villesCount}</span></div>
                            )}
                            <ul className="list-disc pl-6">
                                {villes.map(v => (
                                    <li key={v.id}>
                                        <strong>{v.ville}</strong> — id: <code>{v.id}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}