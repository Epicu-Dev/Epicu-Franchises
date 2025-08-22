"use client";
import { useState, useEffect } from 'react';
import { getValidAccessToken } from '../../utils/auth';

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

  const [villesNextOffset, setVillesNextOffset] = useState<number | null>(0);
  const [villesHasMore, setVillesHasMore] = useState<boolean>(false);

  const [selected, setSelected] = useState<string | null>('categories');

  // Agenda specific
  const [agendaStart, setAgendaStart] = useState<string>(() => new Date().toISOString().split('T')[0]); // default today
  const [agendaEnd, setAgendaEnd] = useState<string | null>(null);
  const [agendaLimit, setAgendaLimit] = useState<number>(50);
  const [agendaOffset, setAgendaOffset] = useState<number>(0);
  const [agendaEvents, setAgendaEvents] = useState<{ id: string; description?: string; date: string; task?: string; type?: string }[]>([]);
  const [agendaLoading, setAgendaLoading] = useState<boolean>(false);
  // Create event form state
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [newTask, setNewTask] = useState<string>('');
  const [newType, setNewType] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);


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

  // wrapper fetch qui injecte l'access token dans l'en-tête Authorization
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No access token');

    const headers = new Headers(init?.headers as HeadersInit || {});
    headers.set('Authorization', `Bearer ${token}`);

    const merged: RequestInit = { ...init, headers };

    return fetch(input, merged);
  };

  // Retourne offset de fuseau pour Europe/Paris au format +HH:MM ou -HH:MM
  const getParisOffset = (dateObj: Date) => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'short' });
      const parts = dtf.formatToParts(dateObj);
      const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
      // tzPart exemple: 'GMT+2' ou 'GMT+1'
      const m = tzPart.match(/GMT([+-]?\d+)/);
      if (m) {
        const hours = parseInt(m[1], 10);
        const sign = hours >= 0 ? '+' : '-';
        const hh = String(Math.abs(hours)).padStart(2, '0');
        return `${sign}${hh}:00`;
      }
    } catch (e) {
      // fallback
    }
    return '+00:00';
  };

  // Récupérer le collaborateur via le token, puis récupérer l'agenda filtré
  const fetchAgenda = async (opts?: { start?: string; end?: string; limit?: number; offset?: number }) => {
    setAgendaLoading(true);
    setError(null);
    try {
      // 1) récupérer le collaborateur lié au token
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string;

      // 2) préparer les params pour l'API agenda
      const params = new URLSearchParams();
      if (collaboratorId) params.set('collaborator', collaboratorId);
      const start = opts?.start ?? agendaStart;
      const end = opts?.end ?? agendaEnd;
      const limit = opts?.limit ?? agendaLimit;
      const offset = opts?.offset ?? agendaOffset;

      if (start) params.set('dateStart', start);
      if (end) params.set('dateEnd', end);
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));

      const url = `/api/agenda?${params.toString()}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error('Erreur lors de la récupération de l\'agenda');
      const data = await res.json();

      setAgendaEvents(data.events || []);
    } catch (err: any) {
      console.error('fetchAgenda error', err);
      setError(err?.message || 'Erreur lors de la récupération de l\'agenda');
    } finally {
      setAgendaLoading(false);
    }
  };

  // Créer un événement d'agenda via POST /api/agenda
  const createAgendaItem = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    if (!newDate || !newTask || !newType) {
      setCreateError('Date, Tâche et Type sont obligatoires');
      return;
    }

    setCreating(true);
    try {
      // récupérer le collaborateur lié au token
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string | undefined;

      // Construire une date ISO en conservant la timezone Europe/Paris
      // newDate a la forme 'YYYY-MM-DDTHH:mm'
      const dateTimeWithSeconds = `${newDate}:00`;
      const d = new Date(dateTimeWithSeconds);
      const parisOffset = getParisOffset(d);
      const dateIsoWithParis = `${newDate}:00${parisOffset}`; // ex: 2025-08-22T14:30:00+02:00

      const payload: any = {
        'Date': dateIsoWithParis,
        'Tâche': newTask,
        'Type': newType,
      };
      if (newDescription) payload['Description'] = newDescription;
      if (collaboratorId) payload['Collaborateur'] = [collaboratorId];

      const res = await authFetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erreur lors de la création');
      }

      const created = await res.json();
      setCreateSuccess(`Événement créé (id: ${created.id})`);
      // reset form
      setNewTask('');
      setNewType('');
      setNewDescription('');

      // rafraîchir l'agenda affiché
      await fetchAgenda();
    } catch (err: any) {
      console.error('createAgendaItem error', err);
      setCreateError(err?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
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
          setLostProspects([]);
          setLostNextOffset(0);
          setLostHasMore(false);

          const url = buildUrl('/api/prospects/glacial', q, 0, PAGE_SIZE);
          const res = await authFetch(url);
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
          const res = await authFetch(url);
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
          const res = await authFetch(url);
          const data = await res.json();

          setDiscussions(data.discussions || []);
          const p: Pagination | undefined = data.pagination;
          setDiscussionsHasMore(Boolean(p?.hasMore));
          setDiscussionsNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'clients': {
          const url = buildUrl('/api/clients/clients', q, 0, PAGE_SIZE);
          const res = await authFetch(url);
          const data = await res.json();
          setClients(data.clients || []);
          break;
        }
        case 'categories': {
          const url = buildUrl('/api/categories', q, 0, PAGE_SIZE);
          const res = await authFetch(url);
          const data = await res.json();
          setCategories(data.results || []);
          break;
        }
        case 'villes': {
          // ✅ Afficher des villes même sans recherche : l’API retourne la première page
          setVilles([]);
          setVillesNextOffset(0);
          setVillesHasMore(false);

          const url = buildUrl('/api/villes', q, 0, PAGE_SIZE);
          const res = await authFetch(url);
          const data = await res.json();

          setVilles(data.results || []);
          const p: Pagination | undefined = data.pagination;
          setVillesHasMore(Boolean(p?.hasMore));
          setVillesNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'agenda': {
          // lancer la récupération de l'agenda pour le collaborateur courant
          await fetchAgenda();
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
  const res = await authFetch(url);
        const data = await res.json();
        setLostProspects(prev => [...prev, ...(data.prospects || [])]);
        const p: Pagination | undefined = data.pagination;
        setLostHasMore(Boolean(p?.hasMore));
        setLostNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'prospects') {
        if (prospectsNextOffset == null) return;
        const url = buildUrl('/api/prospects/prospects', searchQuery, prospectsNextOffset, PAGE_SIZE);
  const res = await authFetch(url);
        const data = await res.json();
        setProspects(prev => [...prev, ...(data.prospects || [])]);
        const p: Pagination | undefined = data.pagination;
        setProspectsHasMore(Boolean(p?.hasMore));
        setProspectsNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'discussion') {
        if (discussionsNextOffset == null) return;
        const url = buildUrl('/api/prospects/discussion', searchQuery, discussionsNextOffset, PAGE_SIZE);
  const res = await authFetch(url);
        const data = await res.json();
        setDiscussions(prev => [...prev, ...(data.discussions || [])]);
        const p: Pagination | undefined = data.pagination;
        setDiscussionsHasMore(Boolean(p?.hasMore));
        setDiscussionsNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'villes') {
        if (villesNextOffset == null) return;
        const url = buildUrl('/api/villes', searchQuery, villesNextOffset, PAGE_SIZE);
  const res = await authFetch(url);
        const data = await res.json();
        setVilles(prev => [...prev, ...(data.results || [])]);
        const p: Pagination | undefined = data.pagination;
        setVillesHasMore(Boolean(p?.hasMore));
        setVillesNextOffset(p?.nextOffset ?? null);
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

  const renderVillesList = (data: { id: string; ville: string }[], canLoadMore: boolean) => (
    <div>
      <h2 className="text-xl font-semibold mb-2">Villes Epicu</h2>
      <ul className="list-disc pl-6">
        {data.map(v => (
          <li key={v.id}>
            <strong>{v.ville}</strong> — id: <code>{v.id}</code>
          </li>
        ))}
      </ul>
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

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Prospects</h1>
      <div className="flex gap-6">
        <aside className="w-1/4 border p-4">
          <h3 className="font-semibold mb-2">Collections</h3>
          <ul className="flex flex-col gap-2">
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'glacial' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('glacial')}>Prospects Glaciaux</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'prospects' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('prospects')}>Prospects</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'discussion' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('discussion')}>En Discussion</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'villes' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('villes')}>Villes Epicu</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'categories' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('categories')}>Catégories</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'clients' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('clients')}>Clients</button></li>
            <li><button className={`w-full text-left px-2 py-1 rounded ${selected === 'agenda' ? 'bg-gray-200' : ''}`} onClick={() => loadCollection('agenda')}>Agenda</button></li>
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
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => { setSearchQuery(''); if (selected) loadCollection(selected, ''); }}>Réinitialiser</button>
            </div>
          </div>

          {/* Controls for Agenda */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold mb-2">Agenda</h4>
            <label className="block text-sm">Date début</label>
            <input type="date" className="w-full border px-2 py-1 rounded" value={agendaStart} onChange={(e) => setAgendaStart(e.target.value)} />

            <label className="block text-sm mt-2">Date fin (optionnelle)</label>
            <input type="date" className="w-full border px-2 py-1 rounded" value={agendaEnd || ''} onChange={(e) => setAgendaEnd(e.target.value || null)} />

            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <label className="block text-sm">Limit</label>
                <input type="number" className="w-full border px-2 py-1 rounded" value={agendaLimit} onChange={(e) => setAgendaLimit(Number(e.target.value || 0))} />
              </div>
              <div className="flex-1">
                <label className="block text-sm">Offset</label>
                <input type="number" className="w-full border px-2 py-1 rounded" value={agendaOffset} onChange={(e) => setAgendaOffset(Number(e.target.value || 0))} />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => fetchAgenda()}>Charger l'agenda</button>
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => { setAgendaEnd(null); setAgendaStart(new Date().toISOString().split('T')[0]); setAgendaLimit(50); setAgendaOffset(0); }}>Réinitialiser</button>
            </div>
          </div>

          {/* Formulaire de création d'événement */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold mb-2">Créer un événement (test)</h4>

            <label className="block text-sm">Date et heure <span className="text-red-600">*</span></label>
            <input type="datetime-local" className="w-full border px-2 py-1 rounded" value={newDate} onChange={(e) => setNewDate(e.target.value)} />

            <label className="block text-sm mt-2">Tâche <span className="text-red-600">*</span></label>
            <input type="text" className="w-full border px-2 py-1 rounded" value={newTask} onChange={(e) => setNewTask(e.target.value)} />

            <label className="block text-sm mt-2">Type <span className="text-red-600">*</span></label>
            <input type="text" className="w-full border px-2 py-1 rounded" value={newType} onChange={(e) => setNewType(e.target.value)} />

            <label className="block text-sm mt-2">Description (optionnelle)</label>
            <textarea className="w-full border px-2 py-1 rounded" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />

            {createError && <div className="text-red-500 mt-2">{createError}</div>}
            {createSuccess && <div className="text-green-600 mt-2">{createSuccess}</div>}

            <div className="mt-3 flex gap-2">
              <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={creating} onClick={() => createAgendaItem()}>{creating ? 'Création…' : 'Créer'}</button>
              <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => { setNewDate(new Date().toISOString().slice(0,16)); setNewTask(''); setNewType(''); setNewDescription(''); setCreateError(null); setCreateSuccess(null); }}>Annuler</button>
            </div>
          </div>
        </aside>

        <section className="flex-1 border p-4">
          {loading && <div>Chargement...</div>}
          {error && <div className="text-red-500">{error}</div>}

          {!loading && !error && selected === null && <div>Sélectionnez une collection à gauche pour afficher les résultats.</div>}

          {!loading && !error && selected === 'glacial' && renderProspectTable(lostProspects, 'Prospects Glaciaux', lostHasMore)}
          {!loading && !error && selected === 'prospects' && renderProspectTable(prospects, 'Prospects', prospectsHasMore)}
          {!loading && !error && selected === 'discussion' && renderProspectTable(discussions, 'En Discussion', discussionsHasMore)}
          {!loading && !error && selected === 'clients' && renderClientsTable(clients)}
          {!loading && !error && selected === 'villes' && renderVillesList(villes, villesHasMore)}
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
          {!loading && !error && selected === 'agenda' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Agenda</h2>
              {agendaLoading && <div>Chargement de l'agenda...</div>}
              {!agendaLoading && agendaEvents.length === 0 && <div>Aucun événement</div>}
              {!agendaLoading && agendaEvents.length > 0 && (
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Date</th>
                      <th className="border px-2 py-1">Tâche</th>
                      <th className="border px-2 py-1">Type</th>
                      <th className="border px-2 py-1">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaEvents.map(ev => (
                      <tr key={ev.id}>
                        <td className="border px-2 py-1">{ev.date}</td>
                        <td className="border px-2 py-1">{ev.task || '-'}</td>
                        <td className="border px-2 py-1">{ev.type || '-'}</td>
                        <td className="border px-2 py-1">{ev.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
