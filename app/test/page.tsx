"use client";
import { useState, useEffect } from 'react';
import { getValidAccessToken } from '../../utils/auth';

// ———————————————————————————————————————————————————————————
// Types
// ———————————————————————————————————————————————————————————

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

type Collaborateur = {
  id: string;                // record id du collaborateur
  nomComplet: string;        // "Nom complet"
  villes: string[];          // liste de noms de villes EPICU
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

// TODOs
export type TodoItem = {
  id: string;
  name: string;              // Nom de la tâche
  createdAt: string;         // Date de création (ISO)
  dueDate?: string;          // Date d'échéance (ISO | '')
  status: string;            // Statut
  type: string;              // Type de tâche
  description?: string;      // Description
  collaborators?: string[];  // Linked ids
};

const PAGE_SIZE = 10;

// ———————————————————————————————————————————————————————————
// Composant principal
// ———————————————————————————————————————————————————————————

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
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterSuivi, setFilterSuivi] = useState<string | null>(null);
  const [collaboratorSearch, setCollaboratorSearch] = useState<string>('');

  // Pagination
  const [lostNextOffset, setLostNextOffset] = useState<number | null>(0);
  const [lostHasMore, setLostHasMore] = useState<boolean>(false);
  const [prospectsNextOffset, setProspectsNextOffset] = useState<number | null>(0);
  const [prospectsHasMore, setProspectsHasMore] = useState<boolean>(false);
  const [discussionsNextOffset, setDiscussionsNextOffset] = useState<number | null>(0);
  const [discussionsHasMore, setDiscussionsHasMore] = useState<boolean>(false);
  const [villesNextOffset, setVillesNextOffset] = useState<number | null>(0);
  const [villesHasMore, setVillesHasMore] = useState<boolean>(false);
  const [collabNextOffset, setCollabNextOffset] = useState<number | null>(0);
  const [collabHasMore, setCollabHasMore] = useState<boolean>(false);

  const [selected, setSelected] = useState<string | null>('categories');

  // ——— Agenda ———
  const [agendaStart, setAgendaStart] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [agendaEnd, setAgendaEnd] = useState<string | null>(null);
  const [agendaLimit, setAgendaLimit] = useState<number>(50);
  const [agendaOffset, setAgendaOffset] = useState<number>(0);
  const [agendaEvents, setAgendaEvents] = useState<{ id: string; description?: string; date: string; task?: string; type?: string }[]>([]);
  const [agendaLoading, setAgendaLoading] = useState<boolean>(false);

  // Form agenda
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [newTask, setNewTask] = useState<string>('');
  const [newType, setNewType] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ——— TODO ———
  const [todoLimit, setTodoLimit] = useState<number>(50);
  const [todoOffset, setTodoOffset] = useState<number>(0);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [todoLoading, setTodoLoading] = useState<boolean>(false);

  // Form TODO (champs requis sauf dueDate + description)
  const [todoName, setTodoName] = useState<string>('');
  const [todoCreatedAt, setTodoCreatedAt] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [todoDueDate, setTodoDueDate] = useState<string>('');
  const [todoStatus, setTodoStatus] = useState<string>('À faire');
  const [todoType, setTodoType] = useState<string>('Général');
  const [todoDesc, setTodoDesc] = useState<string>('');
  const [todoCreating, setTodoCreating] = useState<boolean>(false);
  const [todoCreateError, setTodoCreateError] = useState<string | null>(null);
  const [todoCreateSuccess, setTodoCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
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

  // wrapper fetch
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No access token');
    const headers = new Headers((init?.headers as HeadersInit) || {});
    headers.set('Authorization', `Bearer ${token}`);
    const merged: RequestInit = { ...init, headers };
    return fetch(input, merged);
  };

  // précharger les collaborateurs pour le filtre (page init)
  const fetchCollaborateursList = async () => {
    try {
      const res = await authFetch('/api/collaborateurs?limit=200&offset=0');
      if (!res.ok) return;
      const data = await res.json();
      // data.results expected
      setCollaborateurs(data.results || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchCollaborateursList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getParisOffset = (dateObj: Date) => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'short' });
      const parts = dtf.formatToParts(dateObj);
      const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
      const m = tzPart.match(/GMT([+-]?\d+)/);
      if (m) {
        const hours = parseInt(m[1], 10);
        const sign = hours >= 0 ? '+' : '-';
        const hh = String(Math.abs(hours)).padStart(2, '0');
        return `${sign}${hh}:00`;
      }
    } catch {}
    return '+00:00';
  };

  // ———————————————————————————————————————————————————————————
  // Agenda
  // ———————————————————————————————————————————————————————————

  const fetchAgenda = async (opts?: { start?: string; end?: string; limit?: number; offset?: number }) => {
    setAgendaLoading(true);
    setError(null);
    try {
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string;

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

  const createAgendaItem = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (!newDate || !newTask || !newType) {
      setCreateError('Date, Tâche et Type sont obligatoires');
      return;
    }
    setCreating(true);
    try {
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string | undefined;

      const dateTimeWithSeconds = `${newDate}:00`;
      const d = new Date(dateTimeWithSeconds);
      const parisOffset = getParisOffset(d);
      const dateIsoWithParis = `${newDate}:00${parisOffset}`;

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
      setNewTask('');
      setNewType('');
      setNewDescription('');
      await fetchAgenda();
    } catch (err: any) {
      console.error('createAgendaItem error', err);
      setCreateError(err?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  // ———————————————————————————————————————————————————————————
  // TODOs (visualisation + ajout)
  // ———————————————————————————————————————————————————————————

  const fetchTodos = async (opts?: { limit?: number; offset?: number }) => {
    setTodoLoading(true);
    setError(null);
    try {
      // récupérer le collaborateur lié au token
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string;

      const params = new URLSearchParams();
      params.set('collaborator', collaboratorId);
      const limit = opts?.limit ?? todoLimit;
      const offset = opts?.offset ?? todoOffset;
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));

      const url = `/api/todo?${params.toString()}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error('Erreur lors de la récupération des TODO');
      const data = await res.json();
      setTodoItems(data.todos || []);
    } catch (err: any) {
      console.error('fetchTodos error', err);
      setError(err?.message || 'Erreur lors de la récupération des TODO');
    } finally {
      setTodoLoading(false);
    }
  };

  const createTodo = async () => {
    setTodoCreateError(null);
    setTodoCreateSuccess(null);

    if (!todoName || !todoCreatedAt || !todoStatus || !todoType) {
      setTodoCreateError('Nom, Date de création, Statut et Type sont obligatoires');
      return;
    }

    setTodoCreating(true);
    try {
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Impossible de récupérer le collaborateur');
      const me = await meRes.json();
      const collaboratorId = me.id as string | undefined;

      const createdBase = `${todoCreatedAt}:00`;
      const createdDate = new Date(createdBase);
      const createdOffset = getParisOffset(createdDate);
      const createdIso = `${todoCreatedAt}:00${createdOffset}`;

      let dueIso: string | undefined;
      if (todoDueDate) {
        const dueBase = `${todoDueDate}:00`;
        const dueDate = new Date(dueBase);
        const dueOffset = getParisOffset(dueDate);
        dueIso = `${todoDueDate}:00${dueOffset}`;
      }

      const payload: any = {
        'Nom de la tâche': todoName,
        'Date de création': createdIso,
        'Statut': todoStatus,
        'Type de tâche': todoType,
      };
      if (todoDesc) payload['Description'] = todoDesc;
      if (dueIso) payload['Date d\'échéance'] = dueIso;
      if (collaboratorId) payload['Collaborateur'] = [collaboratorId];

      const res = await authFetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erreur lors de la création du TODO');
      }
      const created = await res.json();
      setTodoCreateSuccess(`TODO créé (id: ${created.id})`);

      // reset formulaire
      setTodoName('');
      setTodoType('Général');
      setTodoStatus('À faire');
      setTodoDesc('');
      setTodoDueDate('');

      // refresh
      await fetchTodos();
    } catch (err: any) {
      console.error('createTodo error', err);
      setTodoCreateError(err?.message || 'Erreur lors de la création du TODO');
    } finally {
      setTodoCreating(false);
    }
  };

  // ———————————————————————————————————————————————————————————
  // Chargements collections
  // ———————————————————————————————————————————————————————————

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
          // include optional filters category and suivi
          const params = new URLSearchParams();
          if (q) params.set('q', q);
          params.set('limit', String(PAGE_SIZE));
          params.set('offset', '0');
          if (filterCategory) params.set('category', filterCategory);
          if (filterSuivi) params.set('suivi', filterSuivi);
          const url = `/api/prospects/discussion?${params.toString()}`;
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
        case 'collaborateurs': {
          setCollaborateurs([]);
          setCollabNextOffset(0);
          setCollabHasMore(false);
          const url = buildUrl('/api/collaborateurs', q, 0, PAGE_SIZE);
          const res = await authFetch(url);
          const data = await res.json();
          setCollaborateurs(data.results || []);
          const p: Pagination | undefined = data.pagination;
          setCollabHasMore(Boolean(p?.hasMore));
          setCollabNextOffset(p?.nextOffset ?? null);
          break;
        }
        case 'agenda': {
          await fetchAgenda();
          break;
        }
        case 'todo': {
          await fetchTodos();
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
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(discussionsNextOffset));
        if (filterCategory) params.set('category', filterCategory);
        if (filterSuivi) params.set('suivi', filterSuivi);
        const url = `/api/prospects/discussion?${params.toString()}`;
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
      } else if (selected === 'collaborateurs') {
        if (collabNextOffset == null) return;
        const url = buildUrl('/api/collaborateurs', searchQuery, collabNextOffset, PAGE_SIZE);
        const res = await authFetch(url);
        const data = await res.json();
        setCollaborateurs(prev => [...prev, ...(data.results || [])]);
        const p: Pagination | undefined = data.pagination;
        setCollabHasMore(Boolean(p?.hasMore));
        setCollabNextOffset(p?.nextOffset ?? null);
      }
    } catch {
      setError('Erreur lors du chargement supplémentaire');
    } finally {
      setLoadingMore(false);
    }
  };

  // ———————————————————————————————————————————————————————————
  // Renders
  // ———————————————————————————————————————————————————————————

  const Field = ({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );

  const Card = ({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) => (
    <div className="bg-white border rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
      {footer && <div className="pt-3 mt-3 border-t">{footer}</div>}
    </div>
  );

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition ${props.className || ''}`} />
  );
  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition ${props.className || ''}`} />
  );
  const Button = ({ variant = 'primary', className = '', ...rest }: any) => {
    const base = 'px-4 py-2 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed';
    const styles: Record<string,string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      ghost: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
  };

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-gray-700 bg-gray-50">{children}</span>
  );

  const renderProspectTable = (data: Prospect[], title: string, canLoadMore: boolean) => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Nom établissement</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Catégorie</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Ville</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Suivi par...</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Commentaires</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Date de relance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 text-sm">{p.nomEtablissement}</td>
                <td className="px-3 py-2 text-sm">{p.categorie}</td>
                <td className="px-3 py-2 text-sm">{p.ville || '-'}</td>
                <td className="px-3 py-2 text-sm">{p.suiviPar || '-'}</td>
                <td className="px-3 py-2 text-sm">{p.commentaires || '-'}</td>
                <td className="px-3 py-2 text-sm">{p.dateRelance || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canLoadMore && (
        <div>
          <Button onClick={loadMore}>{loadingMore ? 'Chargement…' : 'Charger plus'}</Button>
        </div>
      )}
    </div>
  );

  const renderClientsTable = (data: Client[]) => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Clients</h2>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Nom établissement</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Catégorie</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Raison sociale</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Date signature</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 text-sm">{c.nomEtablissement}</td>
                <td className="px-3 py-2 text-sm">{c.categorie}</td>
                <td className="px-3 py-2 text-sm">{c.raisonSociale || '-'}</td>
                <td className="px-3 py-2 text-sm">{c.dateSignature || '-'}</td>
                <td className="px-3 py-2 text-sm">{c.commentaire || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVillesList = (data: { id: string; ville: string }[], canLoadMore: boolean) => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Villes Epicu</h2>
      <ul className="list-disc pl-6 space-y-1">
        {data.map(v => (
          <li key={v.id} className="text-sm"><strong>{v.ville}</strong> — id: <code>{v.id}</code></li>
        ))}
      </ul>
      {canLoadMore && (
        <div>
          <Button onClick={loadMore}>{loadingMore ? 'Chargement…' : 'Charger plus'}</Button>
        </div>
      )}
    </div>
  );

  const renderCollaborateursTable = (data: Collaborateur[], canLoadMore: boolean) => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Collaborateurs</h2>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Nom complet</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Ville EPICU</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Record ID</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 text-sm">{c.nomComplet || '-'}</td>
                <td className="px-3 py-2 text-sm">{(c.villes && c.villes.length > 0) ? c.villes.join(', ') : '-'}</td>
                <td className="px-3 py-2 text-sm"><code>{c.id}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canLoadMore && (
        <div>
          <Button onClick={loadMore}>{loadingMore ? 'Chargement…' : 'Charger plus'}</Button>
        </div>
      )}
    </div>
  );

  // Cartes de formulaire "plus joli"
  const AgendaControls = () => (
    <Card title="Agenda — Filtres & Création" footer={null}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Date début" required>
          <Input type="date" value={agendaStart} onChange={(e) => setAgendaStart(e.target.value)} />
        </Field>
        <Field label="Date fin" hint="Optionnelle">
          <Input type="date" value={agendaEnd || ''} onChange={(e) => setAgendaEnd(e.target.value || null)} />
        </Field>
        <Field label="Limit">
          <Input type="number" value={agendaLimit} onChange={(e) => setAgendaLimit(Number(e.target.value || 0))} />
        </Field>
        <Field label="Offset">
          <Input type="number" value={agendaOffset} onChange={(e) => setAgendaOffset(Number(e.target.value || 0))} />
        </Field>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => fetchAgenda()}>{agendaLoading ? 'Chargement…' : 'Charger l\'agenda'}</Button>
        <Button variant="ghost" onClick={() => { setAgendaEnd(null); setAgendaStart(new Date().toISOString().split('T')[0]); setAgendaLimit(50); setAgendaOffset(0); }}>Réinitialiser</Button>
      </div>

      <div className="pt-4">
        <h5 className="font-medium mb-2">Créer un événement</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date et heure" required>
            <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </Field>
          <Field label="Type" required>
            <Input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} />
          </Field>
          <Field label="Tâche" required>
            <Input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
          </Field>
          <Field label="Description" hint="Optionnelle">
            <Textarea rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </Field>
        </div>
        {createError && <div className="text-red-500 mt-2 text-sm">{createError}</div>}
        {createSuccess && <div className="text-emerald-600 mt-2 text-sm">{createSuccess}</div>}
        <div className="flex gap-2 pt-2">
          <Button onClick={() => createAgendaItem()} disabled={creating}>{creating ? 'Création…' : 'Créer'}</Button>
          <Button variant="ghost" onClick={() => { setNewDate(new Date().toISOString().slice(0,16)); setNewTask(''); setNewType(''); setNewDescription(''); setCreateError(null); setCreateSuccess(null); }}>Annuler</Button>
        </div>
      </div>
    </Card>
  );

  const TodoControls = () => (
    <Card title="TODO — Filtres & Création" footer={null}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Limit">
          <Input type="number" value={todoLimit} onChange={(e) => setTodoLimit(Number(e.target.value || 0))} />
        </Field>
        <Field label="Offset">
          <Input type="number" value={todoOffset} onChange={(e) => setTodoOffset(Number(e.target.value || 0))} />
        </Field>
        <div className="flex items-end">
          <Button onClick={() => fetchTodos()}>{todoLoading ? 'Chargement…' : 'Charger les TODO'}</Button>
        </div>
      </div>

      <div className="pt-4">
        <h5 className="font-medium mb-2">Ajouter un TODO</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de la tâche" required>
            <Input type="text" value={todoName} onChange={(e) => setTodoName(e.target.value)} placeholder="Ex: Relancer Camping Les Flots" />
          </Field>
          <Field label="Type de tâche" required>
            <Input type="text" value={todoType} onChange={(e) => setTodoType(e.target.value)} placeholder="Ex: Relance / Appel / Email" />
          </Field>
          <Field label="Date de création" required>
            <Input type="datetime-local" value={todoCreatedAt} onChange={(e) => setTodoCreatedAt(e.target.value)} />
          </Field>
          <Field label="Statut" required>
            <Input type="text" value={todoStatus} onChange={(e) => setTodoStatus(e.target.value)} placeholder="Ex: À faire / En cours / Fait" />
          </Field>
          <Field label="Date d'échéance" hint="Optionnelle">
            <Input type="datetime-local" value={todoDueDate} onChange={(e) => setTodoDueDate(e.target.value)} />
          </Field>
          <Field label="Description" hint="Optionnelle">
            <Textarea rows={3} value={todoDesc} onChange={(e) => setTodoDesc(e.target.value)} />
          </Field>
        </div>
        {todoCreateError && <div className="text-red-500 mt-2 text-sm">{todoCreateError}</div>}
        {todoCreateSuccess && <div className="text-emerald-600 mt-2 text-sm">{todoCreateSuccess}</div>}
        <div className="flex gap-2 pt-2">
          <Button onClick={() => createTodo()} disabled={todoCreating}>{todoCreating ? 'Création…' : 'Créer le TODO'}</Button>
          <Button variant="ghost" onClick={() => { setTodoName(''); setTodoType('Général'); setTodoStatus('À faire'); setTodoDesc(''); setTodoDueDate(''); setTodoCreatedAt(new Date().toISOString().slice(0,16)); setTodoCreateError(null); setTodoCreateSuccess(null); }}>Annuler</Button>
        </div>
      </div>
    </Card>
  );

  const TodoList = () => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Mes TODO</h2>
      {todoLoading && <div>Chargement des TODO…</div>}
      {!todoLoading && todoItems.length === 0 && <div>Aucun TODO</div>}
      {!todoLoading && todoItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {todoItems.map((t) => (
            <div key={t.id} className="rounded-2xl border p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{t.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{t.type || '—'}</Badge>
                    <Badge>{t.status || '—'}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Créé le :</span> {t.createdAt}</p>
                <p><span className="font-medium">Échéance :</span> {t.dueDate || '—'}</p>
                {t.description && <p className="text-gray-700">{t.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Test Prospects</h1>
      <div className="flex gap-6">
        {/* ————————————————— Sidebar ————————————————— */}
        <aside className="w-full md:w-80 space-y-4">
          <Card title="Collections">
            <ul className="flex flex-col gap-2">
              {[
                { key: 'glacial', label: 'Prospects Glaciaux' },
                { key: 'prospects', label: 'Prospects' },
                { key: 'discussion', label: 'En Discussion' },
                { key: 'villes', label: 'Villes Epicu' },
                { key: 'categories', label: 'Catégories' },
                { key: 'clients', label: 'Clients' },
                { key: 'collaborateurs', label: 'Collaborateurs' },
                { key: 'agenda', label: 'Agenda' },
                { key: 'todo', label: 'TODO' },
              ].map(it => (
                <li key={it.key}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-xl border transition ${selected === it.key ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                    onClick={() => loadCollection(it.key)}
                  >{it.label}</button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Rechercher…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && selected) loadCollection(selected, searchQuery); }} />
              <Button onClick={() => selected && loadCollection(selected, searchQuery)}>Go</Button>
            </div>
          </Card>

          {/* Panneau Agenda */}
          <AgendaControls />

          {/* Panneau TODO */}
          <TodoControls />
        </aside>

        {/* ————————————————— Contenu ————————————————— */}
        <section className="flex-1 space-y-6">
          {loading && <div className="rounded-xl border bg-white p-4">Chargement…</div>}
          {error && <div className="rounded-xl border bg-red-50 text-red-700 p-4">{error}</div>}

          {!loading && !error && selected === null && (
            <div className="rounded-xl border bg-white p-6">Sélectionnez une collection à gauche pour afficher les résultats.</div>
          )}

          {!loading && !error && selected === 'glacial' && renderProspectTable(lostProspects, 'Prospects Glaciaux', lostHasMore)}
          {!loading && !error && selected === 'prospects' && renderProspectTable(prospects, 'Prospects', prospectsHasMore)}
          {!loading && !error && selected === 'discussion' && (
            <div className="space-y-4">
              <Card title="Filtres - En discussion">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <select className="w-full border rounded-xl px-3 py-2" value={filterCategory ?? ''} onChange={(e) => setFilterCategory(e.target.value || null)}>
                      <option value="">— Toutes —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Suivi par...</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2"
                      placeholder="Rechercher collaborateur..."
                      value={collaboratorSearch}
                      onChange={(e) => setCollaboratorSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()} // prevent bubbling that may change focus
                    />
                    <select className="w-full border rounded-xl px-3 py-2 mt-2" value={filterSuivi ?? ''} onChange={(e) => setFilterSuivi(e.target.value || null)}>
                      <option value="">— Aucun (tous) —</option>
                      {(collaborateurs.filter(c => (c.nomComplet || '').toLowerCase().includes(collaboratorSearch.toLowerCase())).map(c => (
                        <option key={c.id} value={c.id}>{c.nomComplet || c.id}</option>
                      )))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => loadCollection('discussion', searchQuery)}>Appliquer</button>
                    <button className="bg-gray-100 px-3 py-2 rounded" onClick={() => { setFilterCategory(null); setFilterSuivi(null); setCollaboratorSearch(''); }}>Réinitialiser</button>
                  </div>
                </div>
              </Card>

              {renderProspectTable(discussions, 'En Discussion', discussionsHasMore)}
            </div>
          )}
          {!loading && !error && selected === 'clients' && renderClientsTable(clients)}
          {!loading && !error && selected === 'villes' && renderVillesList(villes, villesHasMore)}
          {!loading && !error && selected === 'categories' && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Catégories</h2>
              <ul className="list-disc pl-6 space-y-1">
                {categories.map(c => (
                  <li key={c.id} className="text-sm"><strong>{c.name}</strong> — id: <code>{c.id}</code></li>
                ))}
              </ul>
            </div>
          )}
          {!loading && !error && selected === 'collaborateurs' && renderCollaborateursTable(collaborateurs, collabHasMore)}

          {!loading && !error && selected === 'agenda' && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Agenda</h2>
              {agendaLoading && <div className="rounded-xl border bg-white p-4">Chargement de l'agenda…</div>}
              {!agendaLoading && agendaEvents.length === 0 && <div className="rounded-xl border bg-white p-4">Aucun événement</div>}
              {!agendaLoading && agendaEvents.length > 0 && (
                <div className="overflow-auto rounded-xl border">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Tâche</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Type</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendaEvents.map(ev => (
                        <tr key={ev.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{ev.date}</td>
                          <td className="px-3 py-2 text-sm">{ev.task || '-'}</td>
                          <td className="px-3 py-2 text-sm">{ev.type || '-'}</td>
                          <td className="px-3 py-2 text-sm">{ev.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && !error && selected === 'todo' && (
            <div className="space-y-4">
              <TodoList />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
