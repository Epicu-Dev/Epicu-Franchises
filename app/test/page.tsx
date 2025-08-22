"use client";
import { useState, useEffect } from 'react';

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

type Pagination = {
  limit: number;
  offset: number;
  orderBy: string;
  order: 'asc' | 'desc';
  hasMore: boolean;
  nextOffset: number | null;
  prevOffset: number;
};

const PAGE_SIZE = 10;

export default function TestProspects() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données
  const [lostProspects, setLostProspects] = useState<Prospect[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [discussions, setDiscussions] = useState<Prospect[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [villes, setVilles] = useState<{ id: string; ville: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Pagination
  const [lostNextOffset, setLostNextOffset] = useState<number | null>(0);
  const [lostHasMore, setLostHasMore] = useState<boolean>(false);

  const [prospectsNextOffset, setProspectsNextOffset] = useState<number | null>(0);
  const [prospectsHasMore, setProspectsHasMore] = useState<boolean>(false);

  const [discussionsNextOffset, setDiscussionsNextOffset] = useState<number | null>(0);
  const [discussionsHasMore, setDiscussionsHasMore] = useState<boolean>(false);

  const [selected, setSelected] = useState<string | null>('categories');

  useEffect(() => {
    // afficher les catégories par défaut
    loadCollection('categories');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildUrl = (base: string, q: string, offset = 0, limit = PAGE_SIZE) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    return `${base}?${params.toString()}`;
  };

  const loadCollection = async (col: string, q = '') => {
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setSelected(col);

    try {
      switch (col) {
        case 'lost':
        case 'glacial': {
          // reset pagination + liste
          setLostProspects([]);
          setLostNextOffset(0);
          setLostHasMore(false);

          const url = buildUrl('/api/prospects/glacial', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();

          setLostProspects(data.prospects || []);
          const p: Pagination | undefined = data.pagination;
          setLostHasMore(Boolean(p?.hasMore));
          setLostNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'prospects': {
          setProspects([]);
          setProspectsNextOffset(0);
          setProspectsHasMore(false);

          const url = buildUrl('/api/prospects/prospects', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();

          setProspects(data.prospects || []);
          const p: Pagination | undefined = data.pagination;
          setProspectsHasMore(Boolean(p?.hasMore));
          setProspectsNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'discussion': {
          setDiscussions([]);
          setDiscussionsNextOffset(0);
          setDiscussionsHasMore(false);

          const url = buildUrl('/api/prospects/discussion', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();

          setDiscussions(data.discussions || []);
          const p: Pagination | undefined = data.pagination;
          setDiscussionsHasMore(Boolean(p?.hasMore));
          setDiscussionsNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'clients': {
          // Pas de pagination côté client (on ignore les counts)
          const url = buildUrl('/api/clients/clients', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();
          setClients(data.clients || []);
          break;
        }
        case 'categories': {
          const url = buildUrl('/api/categories', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();
          setCategories(data.results || []);
          break;
        }
        case 'villes': {
          const url = buildUrl('/api/villes', q, 0, PAGE_SIZE);
          const res = await fetch(url);
          const data = await res.json();
          setVilles(data.results || []);
          break;
        }
        default:
          break;
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!selected) return;
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      if (selected === 'glacial' || selected === 'lost') {
        if (lostNextOffset == null) return;
        const url = buildUrl('/api/prospects/glacial', searchQuery, lostNextOffset, PAGE_SIZE);
        const res = await fetch(url);
        const data = await res.json();
        setLostProspects(prev => [...prev, ...(data.prospects || [])]);
        const p: Pagination | undefined = data.pagination;
        setLostHasMore(Boolean(p?.hasMore));
        setLostNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'prospects') {
        if (prospectsNextOffset == null) return;
        const url = buildUrl('/api/prospects/prospects', searchQuery, prospectsNextOffset, PAGE_SIZE);
        const res = await fetch(url);
        const data = await res.json();
        setProspects(prev => [...prev, ...(data.prospects || [])]);
        const p: Pagination | undefined = data.pagination;
        setProspectsHasMore(Boolean(p?.hasMore));
        setProspectsNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'discussion') {
        if (discussionsNextOffset == null) return;
        const url = buildUrl('/api/prospects/discussion', searchQuery, discussionsNextOffset, PAGE_SIZE);
        const res = await fetch(url);
        const data = await res.json();
        setDiscussions(prev => [...prev, ...(data.discussions || [])]);
        const p: Pagination | undefined = data.pagination;
        setDiscussionsHasMore(Boolean(p?.hasMore));
        setDiscussionsNextOffset(p?.nextOffset ?? null);
      }
    } catch {
      setError('Erreur lors du chargement supplémentaire');
    } finally {
      setLoadingMore(false);
    }
  };

  const renderProspectTable = (data: Prospect[], title: string, canLoadMore: boolean) => (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
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

      {canLoadMore && (
        <div className="mt-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );

  const renderClientsTable = (data: Client[]) => (
    <div>
      <h2 className="text-xl font-semibold mb-2">Clients</h2>
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
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'glacial' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('glacial')}
              >
                Prospects Glaciaux
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'prospects' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('prospects')}
              >
                Prospects
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'discussion' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('discussion')}
              >
                En Discussion
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'villes' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('villes')}
              >
                Villes Epicu
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'categories' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('categories')}
              >
                Catégories
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selected === 'clients' ? 'bg-gray-200' : ''}`}
                onClick={() => loadCollection('clients')}
              >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selected) loadCollection(selected, searchQuery);
              }}
            />
            <div className="mt-2 flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => selected && loadCollection(selected, searchQuery)}
              >
                Rechercher
              </button>
              <button
                className="bg-gray-200 px-3 py-1 rounded"
                onClick={() => { setSearchQuery(''); if (selected) loadCollection(selected, ''); }}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 border p-4">
          {loading && <div>Chargement...</div>}
          {error && <div className="text-red-500">{error}</div>}

          {!loading && !error && selected === null && (
            <div>Sélectionnez une collection à gauche pour afficher les résultats.</div>
          )}

          {!loading && !error && selected === 'glacial' &&
            renderProspectTable(lostProspects, 'Prospects Glaciaux', lostHasMore)}

          {!loading && !error && selected === 'prospects' &&
            renderProspectTable(prospects, 'Prospects', prospectsHasMore)}

          {!loading && !error && selected === 'discussion' &&
            renderProspectTable(discussions, 'En Discussion', discussionsHasMore)}

          {!loading && !error && selected === 'clients' && renderClientsTable(clients)}

          {!loading && !error && selected === 'villes' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Villes Epicu</h2>
              <ul className="list-disc pl-6">
                {villes.map(v => (
                  <li key={v.id}>
                    <strong>{v.ville}</strong> — id: <code>{v.id}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && !error && selected === 'categories' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Catégories</h2>
              <ul className="list-disc pl-6">
                {categories.map(c => (
                  <li key={c.id}>
                    <strong>{c.name}</strong> — id: <code>{c.id}</code>
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
