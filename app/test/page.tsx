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

// Invoice type (facturation)
type Invoice = {
  id: string;
  category: string;
  establishmentName: string;
  date: string;
  amount: number;
  serviceType: string;
  status: 'payee' | 'en_attente' | 'retard' | string;
  comment?: string;
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

// Presentational helpers (moved to module scope to keep stable identity)
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

  // --- Prospects creation / edit (test hooks)
  const [pNom, setPNom] = useState<string>('');
  const [pVille, setPVille] = useState<string>('');
  const [pVilleId, setPVilleId] = useState<string>('');
  const [villesOptions, setVillesOptions] = useState<{ id: string; ville: string }[]>([]);
  const [villesQuery, setVillesQuery] = useState<string>('');
  const [villesLoading, setVillesLoading] = useState<boolean>(false);
  const [pTelephone, setPTelephone] = useState<string>('');
  const [pEmail, setPEmail] = useState<string>('');
  const [pSuivi, setPSuivi] = useState<string>('');
  const [pCategorie, setPCategorie] = useState<string>('');
  const [pCategorieId, setPCategorieId] = useState<string>('');
  const [categoriesOptions, setCategoriesOptions] = useState<{ id: string; name: string }[]>([]);
  const [categoriesQuery, setCategoriesQuery] = useState<string>('');
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  // Etat du prospect removed
  const [pDatePremier, setPDatePremier] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [pDatePrise, setPDatePrise] = useState<string>('');
  const [pDateRelance, setPDateRelance] = useState<string>('');
  const [pCommentaires, setPCommentaires] = useState<string>('');
  const [pCreating, setPCreating] = useState<boolean>(false);
  const [pCreateError, setPCreateError] = useState<string | null>(null);
  const [pCreateSuccess, setPCreateSuccess] = useState<string | null>(null);

  // Edit by id
  const [pEditId, setPEditId] = useState<string>('');
  const [pUpdateLoading, setPUpdateLoading] = useState<boolean>(false);
  const [pUpdateError, setPUpdateError] = useState<string | null>(null);
  const [pUpdateSuccess, setPUpdateSuccess] = useState<string | null>(null);

  

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

  // Factures (test)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  // Establishment selector for testing endpoint
  const [estSelectedId, setEstSelectedId] = useState<string>('');
  const [estSearchQuery, setEstSearchQuery] = useState<string>('');
  const [estLoadingList, setEstLoadingList] = useState<boolean>(false);

  const fetchInvoices = async (opts?: { page?: number; limit?: number; status?: string }) => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {

      // determine target endpoint: app-route `/api/facturation` supports status query,
      // but there are also legacy pages endpoints per status: /api/facturation/payee, /attente, /retard
      const page = String(opts?.page ?? 1);
      const limit = String(opts?.limit ?? 20);

      // If caller did not provide a status, call the legacy "payee" endpoint by default
      const providedStatus = opts?.status;
      let url = '';

      if (providedStatus == null || providedStatus === '') {
        const params = new URLSearchParams();
        params.set('limit', limit);
        url = `/api/facturation/payee?${params.toString()}`;
      } else {
        const rawStatus = String(providedStatus);
        // normalize (remove diacritics and spaces)
        const normalize = (s: string) => s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase() : s.replace(/\s+/g, '').toLowerCase();
        const st = normalize(rawStatus);

        if (st.includes('pay') || st === 'payee') {
          const params = new URLSearchParams();
          params.set('limit', limit);
          url = `/api/facturation/payee?${params.toString()}`;
        } else if (st.includes('attent') || st === 'enattente') {
          const params = new URLSearchParams();
          params.set('limit', limit);
          url = `/api/facturation/attente?${params.toString()}`;
        } else if (st.includes('retard')) {
          const params = new URLSearchParams();
          params.set('limit', limit);
          url = `/api/facturation/retard?${params.toString()}`;
        } else {
          const params = new URLSearchParams();
          params.set('page', page);
          params.set('limit', limit);
          params.set('status', rawStatus);
          url = `/api/facturation?${params.toString()}`;
        }
      }

      const res = await authFetch(url);

      if (!res.ok) {
        // surface a clearer message from server when possible
        let text = `Erreur récupération factures (status ${res.status})`;
        try { const j = await res.json(); if (j?.error) text = j.error; } catch {}
        throw new Error(text);
      }

      const data = await res.json();

      // backend may return different shapes depending on which API is hit.
      const items: any[] = data.invoices || data.results || [];

      const normalized: Invoice[] = items.map((it: any) => ({
        id: it.id || it.recordId || String(it.ID || it.Id || ''),
        category: it.category || it.Catégorie || it.categorie || '',
        establishmentName: it.establishmentName || it.establishment || it["Nom de l'établissement"] || it.nomEtablissement || '',
        date: it.date || it.Date || '',
        amount: typeof it.amount === 'number' ? it.amount : (it.amount ?? it['Montant total net'] ?? it.montant ?? 0),
        serviceType: it.serviceType || it['Type de prestation'] || it.typePrestation || '',
        status: it.status || it.statut || it['Statut facture'] || '',
        comment: it.comment || it.commentaire || it.Commentaire || '',
      } as Invoice));

      setInvoices(normalized);
    } catch (err: any) {
      setInvoicesError(err?.message || 'Erreur');
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Fetch list of establishments for the select (without changing `selected`)
  const fetchEstablishmentsList = async () => {
    setEstLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      const res = await authFetch(`/api/clients/clients?${params.toString()}`);

      if (!res.ok) return setClients([]);
      const data = await res.json();

      // populate shared clients state so other panels can reuse it
      setClients(data.clients || []);
    } catch (e) {
      setClients([]);
    } finally {
      setEstLoadingList(false);
    }
  };

  // Fetch invoices for a specific establishment id using the new endpoint
  const fetchInvoicesForEstablishment = async (estId: string, q = '', limit = 50) => {
    if (!estId) {
      setInvoicesError('Aucun établissement sélectionné');
      return;
    }

    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const params = new URLSearchParams();
      params.set('id', estId);
      if (q) params.set('q', q);
      params.set('limit', String(limit));

      const res = await authFetch(`/api/facturation/etablissement?${params.toString()}`);

      if (!res.ok) {
        let text = `Erreur récupération factures (status ${res.status})`;
        try { const j = await res.json(); if (j?.error) text = j.error; } catch {}
        throw new Error(text);
      }

      const data = await res.json();
      const items: any[] = data.invoices || data.results || [];

      const normalized: Invoice[] = items.map((it: any) => ({
        id: it.id || it.recordId || String(it.ID || it.Id || ''),
        category: it.category || it.Catégorie || it.categorie || '',
        establishmentName: it.establishmentName || it.establishment || it["Nom de l'établissement"] || it.nomEtablissement || '',
        date: it.date || it.Date || '',
        amount: typeof it.amount === 'number' ? it.amount : (it.amount ?? it['Montant total net'] ?? it.montant ?? 0),
        serviceType: it.serviceType || it['Type de prestation'] || it.typePrestation || '',
        status: it.status || it.statut || it['Statut facture'] || '',
        comment: it.comment || it.commentaire || it.Commentaire || '',
      } as Invoice));

      setInvoices(normalized);
    } catch (err: any) {
      setInvoicesError(err?.message || 'Erreur');
    } finally {
      setInvoicesLoading(false);
    }
  };

  // fetch villes / categories helper (placed after `selected` declaration)
  const fetchVilles = async (q = '') => {
    setVillesLoading(true);
    try {
      const params = new URLSearchParams();

      if (q) params.set('q', q);
      params.set('limit', '10');
      const res = await authFetch(`/api/villes?${params.toString()}`);

      if (!res.ok) return setVillesOptions([]);
      const data = await res.json();

      setVillesOptions(data.results || []);
    } catch (e) {
      setVillesOptions([]);
    } finally {
      setVillesLoading(false);
    }
  };

  const fetchCategories = async (q = '') => {
    setCategoriesLoading(true);
    try {
      const params = new URLSearchParams();

      if (q) params.set('q', q);
      params.set('limit', '10');
      const res = await authFetch(`/api/categories?${params.toString()}`);

      if (!res.ok) return setCategoriesOptions([]);
      const data = await res.json();

      setCategoriesOptions(data.results || []);
    } catch (e) {
      setCategoriesOptions([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // debounce queries
  useEffect(() => {
    const t = setTimeout(() => fetchVilles(villesQuery), 250);

    return () => clearTimeout(t);
     
  }, [villesQuery]);

  useEffect(() => {
    const t = setTimeout(() => fetchCategories(categoriesQuery), 250);

    return () => clearTimeout(t);
     
  }, [categoriesQuery]);

  // when viewing prospects, prefetch defaults
  useEffect(() => {
    if (selected === 'prospects') {
      fetchVilles('');
      fetchCategories('');
    }
     
  }, [selected]);

  // fetch invoices when user selects the factures collection
  useEffect(() => {
    if (selected === 'factures') {
      fetchInvoices();
    }
  }, [selected]);

  // ——— Agenda ———
  const [agendaStart, setAgendaStart] = useState<string>(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);

    return first.toISOString().split('T')[0];
  });
  const [agendaEnd, setAgendaEnd] = useState<string | null>(null);
  const [agendaLimit, setAgendaLimit] = useState<number>(50);
  const [agendaOffset, setAgendaOffset] = useState<number>(0);
  const [agendaLoading, setAgendaLoading] = useState<boolean>(false);
  const [agendaEvents, setAgendaEvents] = useState<{ id: string; description?: string; date: string; task?: string; type?: string }[]>([]);

  // Form agenda
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [newTask, setNewTask] = useState<string>('');
  const [newType, setNewType] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit / Delete modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTask, setEditTask] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // TODO edit/delete modal state
  const [isTodoEditOpen, setIsTodoEditOpen] = useState<boolean>(false);
  const [todoEditId, setTodoEditId] = useState<string | null>(null);
  const [todoEditName, setTodoEditName] = useState<string>('');
  const [todoEditDue, setTodoEditDue] = useState<string>('');
  const [todoEditStatus, setTodoEditStatus] = useState<string>('');
  const [todoEditType, setTodoEditType] = useState<string>('');
  const [todoEditDesc, setTodoEditDesc] = useState<string>('');
  const [todoEditLoading, setTodoEditLoading] = useState<boolean>(false);
  const [todoEditError, setTodoEditError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection('categories');
     
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
          const paramsG = new URLSearchParams();

          if (q) paramsG.set('q', q);
          paramsG.set('limit', String(PAGE_SIZE));
          paramsG.set('offset', '0');
          if (filterCategory) paramsG.set('category', filterCategory);
          if (filterSuivi) paramsG.set('suivi', filterSuivi);
          const url = `/api/prospects/glacial?${paramsG.toString()}`;
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
          const paramsP = new URLSearchParams();

          if (q) paramsP.set('q', q);
          paramsP.set('limit', String(PAGE_SIZE));
          paramsP.set('offset', '0');
          if (filterCategory) paramsP.set('category', filterCategory);
          if (filterSuivi) paramsP.set('suivi', filterSuivi);
          const url = `/api/prospects/prospects?${paramsP.toString()}`;
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
        const paramsG = new URLSearchParams();

        if (searchQuery) paramsG.set('q', searchQuery);
        paramsG.set('limit', String(PAGE_SIZE));
        paramsG.set('offset', String(lostNextOffset));
        if (filterCategory) paramsG.set('category', filterCategory);
        if (filterSuivi) paramsG.set('suivi', filterSuivi);
        const url = `/api/prospects/glacial?${paramsG.toString()}`;
        const res = await authFetch(url);
        const data = await res.json();

        setLostProspects(prev => [...prev, ...(data.prospects || [])]);
        const p: Pagination | undefined = data.pagination;

        setLostHasMore(Boolean(p?.hasMore));
        setLostNextOffset(p?.nextOffset ?? null);
      } else if (selected === 'prospects') {
        if (prospectsNextOffset == null) return;
        const paramsP = new URLSearchParams();

        if (searchQuery) paramsP.set('q', searchQuery);
        paramsP.set('limit', String(PAGE_SIZE));
        paramsP.set('offset', String(prospectsNextOffset));
        if (filterCategory) paramsP.set('category', filterCategory);
        if (filterSuivi) paramsP.set('suivi', filterSuivi);
        const url = `/api/prospects/prospects?${paramsP.toString()}`;
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

  // Renders — use module-scope presentational components (Field, Card, Input, Textarea, Button, Badge)

  const renderProspectTable = (data: Prospect[], title: string, canLoadMore: boolean) => (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Nom établissement</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Date de prise</th>
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
                <td className="px-3 py-2 text-sm">{(p as any).datePriseContact ? new Date((p as any).datePriseContact).toLocaleDateString() : '-'}</td>
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
    <Card footer={null} title="Agenda — Filtres & Création">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field required label="Date début">
          <Input type="date" value={agendaStart} onChange={(e) => setAgendaStart(e.target.value)} />
        </Field>
        <Field hint="Optionnelle" label="Date fin">
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
          <Field required label="Date et heure">
            <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </Field>
          <Field required label="Type">
            <Input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} />
          </Field>
          <Field required label="Tâche">
            <Input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
          </Field>
          <Field hint="Optionnelle" label="Description">
            <Textarea rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </Field>
        </div>
        {createError && <div className="text-red-500 mt-2 text-sm">{createError}</div>}
        {createSuccess && <div className="text-emerald-600 mt-2 text-sm">{createSuccess}</div>}
        <div className="flex gap-2 pt-2">
          <Button disabled={creating} onClick={() => createAgendaItem()}>{creating ? 'Création…' : 'Créer'}</Button>
          <Button variant="ghost" onClick={() => { setNewDate(new Date().toISOString().slice(0,16)); setNewTask(''); setNewType(''); setNewDescription(''); setCreateError(null); setCreateSuccess(null); }}>Annuler</Button>
        </div>
      </div>
    </Card>
  );

  const TodoControls = () => (
    <Card footer={null} title="TODO — Filtres & Création">
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
          <Field required label="Nom de la tâche">
            <Input placeholder="Ex: Relancer Camping Les Flots" type="text" value={todoName} onChange={(e) => setTodoName(e.target.value)} />
          </Field>
          <Field required label="Type de tâche">
            <Input placeholder="Ex: Relance / Appel / Email" type="text" value={todoType} onChange={(e) => setTodoType(e.target.value)} />
          </Field>
          <Field required label="Date de création">
            <Input type="datetime-local" value={todoCreatedAt} onChange={(e) => setTodoCreatedAt(e.target.value)} />
          </Field>
          <Field required label="Statut">
            <Input placeholder="Ex: À faire / En cours / Fait" type="text" value={todoStatus} onChange={(e) => setTodoStatus(e.target.value)} />
          </Field>
          <Field hint="Optionnelle" label="Date d'échéance">
            <Input type="datetime-local" value={todoDueDate} onChange={(e) => setTodoDueDate(e.target.value)} />
          </Field>
          <Field hint="Optionnelle" label="Description">
            <Textarea rows={3} value={todoDesc} onChange={(e) => setTodoDesc(e.target.value)} />
          </Field>
        </div>
        {todoCreateError && <div className="text-red-500 mt-2 text-sm">{todoCreateError}</div>}
        {todoCreateSuccess && <div className="text-emerald-600 mt-2 text-sm">{todoCreateSuccess}</div>}
        <div className="flex gap-2 pt-2">
          <Button disabled={todoCreating} onClick={() => createTodo()}>{todoCreating ? 'Création…' : 'Créer le TODO'}</Button>
          <Button variant="ghost" onClick={() => { setTodoName(''); setTodoType('Général'); setTodoStatus('À faire'); setTodoDesc(''); setTodoDueDate(''); setTodoCreatedAt(new Date().toISOString().slice(0,16)); setTodoCreateError(null); setTodoCreateSuccess(null); }}>Annuler</Button>
        </div>
      </div>
    </Card>
  );

  // Prospect creation & edit UI (test)
  // NOTE: Prospect create/edit markup will be inlined into the render to avoid
  // recreating component functions on every render (which caused input focus loss).

  // Create prospect (client) -> POST /api/prospects/prospects
  const createProspect = async () => {
    setPCreateError(null);
    setPCreateSuccess(null);
  if (!pNom || !pVille || !pTelephone || !pCategorie || !pDatePremier || !pDateRelance) {
      setPCreateError('Veuillez renseigner tous les champs requis');

      return;
    }
    setPCreating(true);
    try {
      const payload: any = {
        "Nom de l'établissement": pNom,
        'Ville EPICU': pVille,
        'Téléphone': pTelephone,
        'Catégorie': pCategorie,
  // 'Etat du prospect' removed
  'Date du premier contact': pDatePremier,
  'Date de prise de contact': pDatePrise,
        'Date de relance': pDateRelance,
      };

      // optional fields
      if (pEmail) payload['Email'] = pEmail;
      if (pSuivi) payload['Suivi par'] = [pSuivi];

      if (pCommentaires) payload['Commentaires'] = pCommentaires;

      const res = await authFetch('/api/prospects/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la création du prospect');
      }
      const created = await res.json();

      setPCreateSuccess(`Prospect créé (id: ${created.id})`);
  // reset minimal fields
  setPNom(''); setPVille(''); setPTelephone(''); setPEmail(''); setPSuivi(''); setPCategorie(''); setPDatePremier(new Date().toISOString().split('T')[0]); setPDatePrise(''); setPDateRelance(''); setPCommentaires('');
      // refresh list if showing prospects
      if (selected === 'prospects') loadCollection('prospects');
    } catch (err: any) {
      console.error('createProspect error', err);
      setPCreateError(err?.message || 'Erreur lors de la création');
    } finally {
      setPCreating(false);
    }
  };

  const updateProspect = async () => {
    setPUpdateError(null);
    setPUpdateSuccess(null);
    if (!pEditId) {
      setPUpdateError('Record id requis');

      return;
    }
    setPUpdateLoading(true);
    try {
      const payload: any = {};

      if (pNom) payload["Nom de l'établissement"] = pNom;
      if (pVille) payload['Ville EPICU'] = pVille;
      if (pTelephone) payload['Téléphone'] = pTelephone;
  if (pEmail) payload['Email'] = pEmail;
  if (pSuivi) payload['Suivi par'] = [pSuivi];
      if (pCategorie) payload['Catégorie'] = pCategorie;
      if (pDatePremier) payload['Date du premier contact'] = pDatePremier;
  if (pDatePrise) payload['Date de prise de contact'] = pDatePrise;
      if (pDateRelance) payload['Date de relance'] = pDateRelance;
      if (pCommentaires) payload['Commentaires'] = pCommentaires;

      if (Object.keys(payload).length === 0) {
        setPUpdateError('Aucun champ à mettre à jour');

        return;
      }

      const res = await authFetch(`/api/prospects/prospects?id=${encodeURIComponent(pEditId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la mise à jour');
      }
      const updated = await res.json();

      setPUpdateSuccess(`Prospect mis à jour (id: ${updated.id})`);
      if (selected === 'prospects') loadCollection('prospects');
    } catch (err: any) {
      console.error('updateProspect error', err);
      setPUpdateError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setPUpdateLoading(false);
    }
  };

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
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openTodoEdit(t)}>Modifier</Button>
                  <Button variant="danger" onClick={() => confirmTodoDelete(t.id)}>Supprimer</Button>
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

  // TODO modal helpers & actions
  const openTodoEdit = (t: TodoItem) => {
    setTodoEditId(t.id);
    setTodoEditName(t.name || '');
    // convert created/due to datetime-local if possible for dueDate
    try {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const isoLocal = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16);

        setTodoEditDue(isoLocal);
      } else setTodoEditDue('');
    } catch { setTodoEditDue(t.dueDate || ''); }
    setTodoEditStatus(t.status || '');
    setTodoEditType(t.type || '');
    setTodoEditDesc(t.description || '');
    setTodoEditError(null);
    setIsTodoEditOpen(true);
  };

  const closeTodoEdit = () => {
    setIsTodoEditOpen(false);
    setTodoEditId(null);
    setTodoEditName('');
    setTodoEditDue('');
    setTodoEditStatus('');
    setTodoEditType('');
    setTodoEditDesc('');
    setTodoEditLoading(false);
    setTodoEditError(null);
  };

  const handleTodoUpdate = async () => {
    if (!todoEditId) return;
    setTodoEditLoading(true);
    setTodoEditError(null);
    try {
      const payload: any = {};

      if (todoEditName) payload['Nom de la tâche'] = todoEditName;
      if (todoEditDue) payload["Date d'échéance"] = `${todoEditDue}:00`;
      if (todoEditStatus) payload['Statut'] = todoEditStatus;
      if (todoEditType) payload['Type de tâche'] = todoEditType;
      if (todoEditDesc) payload['Description'] = todoEditDesc;

      const res = await authFetch(`/api/todo?id=${encodeURIComponent(todoEditId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la mise à jour');
      }
      await fetchTodos();
      closeTodoEdit();
    } catch (err: any) {
      setTodoEditError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setTodoEditLoading(false);
    }
  };

  const confirmTodoDelete = (id: string) => {
    setTodoEditId(id);
    setTodoEditError(null);
    setIsTodoEditOpen(true);
  };

  const handleTodoDelete = async () => {
    if (!todoEditId) return;
    setTodoEditLoading(true);
    setTodoEditError(null);
    try {
      const res = await authFetch(`/api/todo?id=${encodeURIComponent(todoEditId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la suppression');
      }
      await fetchTodos();
      closeTodoEdit();
    } catch (err: any) {
      setTodoEditError(err?.message || 'Erreur lors de la suppression');
    } finally {
      setTodoEditLoading(false);
    }
  };

  // — Modal helpers & actions —
  const openEditModal = (ev: { id: string; date: string; task?: string; type?: string; description?: string }) => {
    setEditId(ev.id);
    // convert ISO-ish date to datetime-local input if possible
    try {
      const d = new Date(ev.date);
      const isoLocal = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16);

      setEditDate(isoLocal);
    } catch {
      setEditDate(ev.date || '');
    }
    setEditTask(ev.task || '');
    setEditType(ev.type || '');
    setEditDescription(ev.description || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditId(null);
    setEditDate('');
    setEditTask('');
    setEditType('');
    setEditDescription('');
    setEditLoading(false);
    setEditError(null);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      // Build payload
      const d = editDate ? `${editDate}:00` : undefined;
      const payload: any = {};

      if (d) payload['Date'] = d;
      if (editTask) payload['Tâche'] = editTask;
      if (editType) payload['Type'] = editType;
      if (editDescription) payload['Description'] = editDescription;

      const res = await authFetch(`/api/agenda?id=${encodeURIComponent(editId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la mise à jour');
      }
      await fetchAgenda();
      closeEditModal();
    } catch (err: any) {
      setEditError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    // reuse modal to confirm delete
    setEditId(id);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (!editId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await authFetch(`/api/agenda?id=${encodeURIComponent(editId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err?.error || 'Erreur lors de la suppression');
      }
      await fetchAgenda();
      closeEditModal();
    } catch (err: any) {
      setEditError(err?.message || 'Erreur lors de la suppression');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
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
                { key: 'factures', label: 'Factures' },
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
          
          {/* Panneau Prospects (édition test) - inlined to avoid remounts */}
          <div className="">
            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Prospect — Édition (test)</h4>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium">Modifier un prospect (par id)</h5>
                                    <p className="text-sm text-gray-600">Collez l&apos;id du record (retourné après création) puis renseignez les champs à mettre à jour.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="record-id">Record id (rec...)</label>
                    <Input id="record-id" placeholder="recXXXXXXXXXXXX" type="text" value={pEditId} onChange={(e) => setPEditId(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="champ-update">Champ à mettre à jour (ex: Statut)</label>
                    <Input disabled id="champ-update" placeholder="Vous pouvez remplir ci-dessous les champs à mettre à jour" type="text" onChange={() => {}} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="nom-etablissement">Nom de l&apos;établissement</label>
                    <Input id="nom-etablissement" type="text" value={pNom} onChange={(e) => setPNom(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="ville-epicu">Ville EPICU</label>
                    <Input id="ville-epicu" type="text" value={villesQuery || pVille} onChange={(e) => { setVillesQuery(e.target.value); setPVille(e.target.value); setPVilleId(''); }} />
                    <select className="w-full border rounded-xl px-3 py-2 mt-2" id="ville-select" value={pVilleId || ''} onChange={(e) => {
                      const id = e.target.value;

                      if (!id) { setPVille(''); setPVilleId('');

 return; }
                      const sel = villesOptions.find(v => v.id === id);

                      if (sel) { setPVille(sel.ville); setPVilleId(sel.id); setVillesQuery(''); }
                    }}>
                      <option value="">— Aucun —</option>
                      {villesOptions.map(v => <option key={v.id} value={v.id}>{v.ville}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="categorie">Catégorie</label>
                    <Input id="categorie" type="text" value={categoriesQuery || pCategorie} onChange={(e) => { setCategoriesQuery(e.target.value); setPCategorie(e.target.value); setPCategorieId(''); }} />
                    <select className="w-full border rounded-xl px-3 py-2 mt-2" id="categorie-select" value={pCategorieId || ''} onChange={(e) => {
                      const id = e.target.value;

                      if (!id) { setPCategorie(''); setPCategorieId('');

 return; }
                      const sel = categoriesOptions.find(c => c.id === id);

                      if (sel) { setPCategorie(sel.name); setPCategorieId(sel.id); setCategoriesQuery(''); }
                    }}>
                      <option value="">— Aucun —</option>
                      {categoriesOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Etat du prospect removed */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="date-relance">Date de relance</label>
                    <Input id="date-relance" type="date" value={pDateRelance} onChange={(e) => setPDateRelance(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" htmlFor="commentaires">Commentaires</label>
                    <Textarea id="commentaires" rows={2} value={pCommentaires} onChange={(e) => setPCommentaires(e.target.value)} />
                  </div>
                </div>
                {pUpdateError && <div className="text-red-500 text-sm">{pUpdateError}</div>}
                {pUpdateSuccess && <div className="text-emerald-600 text-sm">{pUpdateSuccess}</div>}
                <div className="flex gap-2 pt-2">
                  <Button disabled={pUpdateLoading} onClick={() => updateProspect()}>{pUpdateLoading ? 'Mise à jour…' : 'Mettre à jour le prospect'}</Button>
                  <Button variant="ghost" onClick={() => { setPEditId(''); setPUpdateError(null); setPUpdateSuccess(null); }}>Annuler</Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ————————————————— Contenu ————————————————— */}
        <section className="flex-1 space-y-6">
          {loading && <div className="rounded-xl border bg-white p-4">Chargement…</div>}
          {error && <div className="rounded-xl border bg-red-50 text-red-700 p-4">{error}</div>}

          {!loading && !error && selected === null && (
            <div className="rounded-xl border bg-white p-6">Sélectionnez une collection à gauche pour afficher les résultats.</div>
          )}

          {/* rendered below with filters when selected === 'prospects' or 'glacial' */}
            {!loading && !error && selected === 'discussion' && (
            <div className="space-y-4">
              <Card title="Filtres - En discussion">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium" htmlFor="filter-category-discussion">Catégorie</label>
                    <select className="w-full border rounded-xl px-3 py-2" id="filter-category-discussion" value={filterCategory ?? ''} onChange={(e) => setFilterCategory(e.target.value || null)}>
                      <option value="">— Toutes —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium" htmlFor="collaborator-search-discussion">Suivi par...</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2"
                      id="collaborator-search-discussion"
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
          {/* Prospects & Glacial filters: reuse same controls when showing those lists */}
          {!loading && !error && (selected === 'prospects' || selected === 'glacial') && (
            <div className="space-y-4">
              <Card title="Filtres">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium" htmlFor="filter-category-prospects">Catégorie</label>
                    <select className="w-full border rounded-xl px-3 py-2" id="filter-category-prospects" value={filterCategory ?? ''} onChange={(e) => setFilterCategory(e.target.value || null)}>
                      <option value="">— Toutes —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium" htmlFor="collaborator-search-prospects">Suivi par...</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2"
                      id="collaborator-search-prospects"
                      placeholder="Rechercher collaborateur..."
                      value={collaboratorSearch}
                      onChange={(e) => setCollaboratorSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <select className="w-full border rounded-xl px-3 py-2 mt-2" value={filterSuivi ?? ''} onChange={(e) => setFilterSuivi(e.target.value || null)}>
                      <option value="">— Aucun (tous) —</option>
                      {(collaborateurs.filter(c => (c.nomComplet || '').toLowerCase().includes(collaboratorSearch.toLowerCase())).map(c => (
                        <option key={c.id} value={c.id}>{c.nomComplet || c.id}</option>
                      )))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => selected && loadCollection(selected, searchQuery)}>Appliquer</button>
                    <button className="bg-gray-100 px-3 py-2 rounded" onClick={() => { setFilterCategory(null); setFilterSuivi(null); setCollaboratorSearch(''); }}>Réinitialiser</button>
                  </div>
                </div>
              </Card>

              {selected === 'prospects' && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Créer un prospect (test)</h4>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Créer un prospect en respectant les noms de champs exacts. L&apos;id créé est affiché en cas de succès — copiez-le pour tester la mise à jour.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* SIRET removed from API - field omitted */}
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="nom-etablissement-create">Nom de l&apos;établissement</label>
                          <Input id="nom-etablissement-create" placeholder="Nom établissement" type="text" value={pNom} onChange={(e) => setPNom(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="ville-epicu-create">Ville EPICU</label>
                          <Input id="ville-epicu-create" placeholder="Rechercher une ville…" type="text" value={villesQuery || pVille} onChange={(e) => { setVillesQuery(e.target.value); setPVille(e.target.value); setPVilleId(''); }} />
                          <select className="w-full border rounded-xl px-3 py-2 mt-2" id="ville-select-create" value={pVilleId || ''} onChange={(e) => {
                            const id = e.target.value;

                            if (!id) { setPVille(''); setPVilleId('');

 return; }
                            const sel = villesOptions.find(v => v.id === id);

                            if (sel) { setPVille(sel.ville); setPVilleId(sel.id); setVillesQuery(''); }
                          }}>
                            <option value="">— Aucun —</option>
                            {villesOptions.map(v => <option key={v.id} value={v.id}>{v.ville}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="telephone">Téléphone</label>
                          <Input id="telephone" placeholder="Téléphone" type="text" value={pTelephone} onChange={(e) => setPTelephone(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="email">Email</label>
                          <Input id="email" placeholder="Email" type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="suivi-par">Suivi par</label>
                          <select id="suivi-par" className="w-full border rounded-xl px-3 py-2" value={pSuivi || ''} onChange={(e) => setPSuivi(e.target.value || '')}>
                            <option value="">— Aucun —</option>
                            {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.nomComplet || c.id}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="categorie-create">Catégorie</label>
                          <Input id="categorie-create" placeholder="Rechercher une catégorie…" type="text" value={categoriesQuery || pCategorie} onChange={(e) => { setCategoriesQuery(e.target.value); setPCategorie(e.target.value); setPCategorieId(''); }} />
                          <select className="w-full border rounded-xl px-3 py-2 mt-2" id="categorie-select-create" value={pCategorieId || ''} onChange={(e) => {
                            const id = e.target.value;

                            if (!id) { setPCategorie(''); setPCategorieId('');

 return; }
                            const sel = categoriesOptions.find(c => c.id === id);

                            if (sel) { setPCategorie(sel.name); setPCategorieId(sel.id); setCategoriesQuery(''); }
                          }}>
                            <option value="">— Aucun —</option>
                            {categoriesOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        {/* Etat du prospect removed */}
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="date-premier">Date du premier contact</label>
                          <Input id="date-premier" type="date" value={pDatePremier} onChange={(e) => setPDatePremier(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="date-prise">Date de prise de contact</label>
                          <Input id="date-prise" type="date" value={pDatePrise} onChange={(e) => setPDatePrise(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium" htmlFor="date-relance-create">Date de relance</label>
                          <Input id="date-relance-create" type="date" value={pDateRelance} onChange={(e) => setPDateRelance(e.target.value)} />
                        </div>
                        {/* 'Je viens de le rencontrer' removed from API and UI */}
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-sm font-medium" htmlFor="commentaires-create">Commentaires</label>
                          <Textarea id="commentaires-create" rows={3} value={pCommentaires} onChange={(e) => setPCommentaires(e.target.value)} />
                        </div>
                      </div>
                      {pCreateError && <div className="text-red-500 text-sm">{pCreateError}</div>}
                      {pCreateSuccess && <div className="text-emerald-600 text-sm">{pCreateSuccess}</div>}
                      <div className="flex gap-2 pt-2">
                        <Button disabled={pCreating} onClick={() => createProspect()}>{pCreating ? 'Création…' : 'Créer le prospect'}</Button>
                        <Button variant="ghost" onClick={() => { setPNom(''); setPVille(''); setPTelephone(''); setPEmail(''); setPSuivi(''); setPCategorie(''); setPDatePremier(new Date().toISOString().split('T')[0]); setPDateRelance(''); setPCommentaires(''); setPCreateError(null); setPCreateSuccess(null); }}>Annuler</Button>
                      </div>
                    </div>
                  </div>
                  {renderProspectTable(prospects, 'Prospects', prospectsHasMore)}
                </div>
              )}
              {selected === 'glacial' && renderProspectTable(lostProspects, 'Prospects Glaciaux', lostHasMore)}
            </div>
          )}
          {!loading && !error && selected === 'clients' && renderClientsTable(clients)}
          {!loading && !error && selected === 'factures' && (
            <div className="space-y-4">
              {/* Test form: select établissement + recherche (placed on top of the list) */}
              <div className="bg-white border rounded-2xl shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label htmlFor="establishment-select" className="text-sm font-medium">Établissement</label>
                    <select id="establishment-select" className="w-full border rounded-xl px-3 py-2" value={estSelectedId} onChange={(e) => setEstSelectedId(e.target.value)} onFocus={() => { if (clients.length === 0) fetchEstablishmentsList(); }}>
                      <option value="">— Sélectionner —</option>
                      {clients.map(c => <option key={c.nomEtablissement || (c as any).id} value={(c as any).id}>{c.nomEtablissement || c.raisonSociale || (c as any).id}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="search-input" className="text-sm font-medium">Recherche</label>
                    <Input id="search-input" placeholder="Recherche texte (catégorie / nom)" value={estSearchQuery} onChange={(e) => setEstSearchQuery(e.target.value)} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={() => fetchInvoicesForEstablishment(estSelectedId, estSearchQuery)}>{invoicesLoading ? 'Chargement…' : 'Rechercher'}</Button>
                    <Button variant="ghost" onClick={() => { setEstSelectedId(''); setEstSearchQuery(''); setInvoices([]); }}>{'Réinitialiser'}</Button>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold">Factures</h2>
              <div className="bg-white border rounded-2xl shadow-sm p-4">
                {invoicesLoading && <div>Chargement des factures</div>}
                {invoicesError && <div className="text-red-600">{invoicesError}</div>}
                {!invoicesLoading && invoices.length === 0 && <div>Aucune facture</div>}
                {!invoicesLoading && invoices.length > 0 && (
                  <div className="overflow-auto rounded-xl border">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Etablissement</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Catégorie</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Montant</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Statut</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="odd:bg-white even:bg-gray-50">
                            <td className="px-3 py-2 text-sm">{inv.date}</td>
                            <td className="px-3 py-2 text-sm">{inv.establishmentName}</td>
                            <td className="px-3 py-2 text-sm">{inv.category}</td>
                            <td className="px-3 py-2 text-sm">{inv.amount}</td>
                            <td className="px-3 py-2 text-sm">{inv.status}</td>
                            <td className="px-3 py-2 text-sm">{inv.serviceType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="pt-3 flex gap-2">
                  <Button onClick={() => fetchInvoices()}>Rafraîchir</Button>
                </div>
              </div>
            </div>
          )}
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
              {agendaLoading && <div className="rounded-xl border bg-white p-4">Chargement de l&apos;agenda…</div>}
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
                        <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendaEvents.map(ev => (
                        <tr key={ev.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{ev.date}</td>
                          <td className="px-3 py-2 text-sm">{ev.task || '-'}</td>
                          <td className="px-3 py-2 text-sm">{ev.type || '-'}</td>
                          <td className="px-3 py-2 text-sm">{ev.description || '-'}</td>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={() => openEditModal(ev)}>Modifier</Button>
                              <Button variant="danger" onClick={() => confirmDelete(ev.id)}>Supprimer</Button>
                            </div>
                          </td>
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
    {/* Edit / Delete Modal */}
    {isEditOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6">
          <h3 className="text-lg font-semibold mb-3">{editId ? (editLoading ? '...' : 'Modifier / Supprimer') : 'Événement'}</h3>
          {editError && <div className="text-red-600 mb-2">{editError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field required label="Date et heure">
              <Input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </Field>
            <Field required label="Type">
              <Input type="text" value={editType} onChange={(e) => setEditType(e.target.value)} />
            </Field>
            <Field required label="Tâche">
              <Input type="text" value={editTask} onChange={(e) => setEditTask(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button disabled={editLoading} variant="danger" onClick={() => handleDelete()}>Supprimer</Button>
            <Button disabled={editLoading} onClick={() => handleUpdate()}>{editLoading ? 'En cours…' : 'Mettre à jour'}</Button>
            <Button disabled={editLoading} variant="ghost" onClick={() => closeEditModal()}>Annuler</Button>
          </div>
        </div>
      </div>
    )}
    {/* TODO Edit / Delete Modal */}
    {isTodoEditOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6">
          <h3 className="text-lg font-semibold mb-3">{todoEditId ? (todoEditLoading ? '...' : 'Modifier / Supprimer TODO') : 'TODO'}</h3>
          {todoEditError && <div className="text-red-600 mb-2">{todoEditError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field required label="Nom de la tâche">
              <Input type="text" value={todoEditName} onChange={(e) => setTodoEditName(e.target.value)} />
            </Field>
            <Field label="Date d&apos;échéance">
              <Input type="datetime-local" value={todoEditDue} onChange={(e) => setTodoEditDue(e.target.value)} />
            </Field>
            <Field label="Statut">
              <Input type="text" value={todoEditStatus} onChange={(e) => setTodoEditStatus(e.target.value)} />
            </Field>
            <Field label="Type">
              <Input type="text" value={todoEditType} onChange={(e) => setTodoEditType(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={todoEditDesc} onChange={(e) => setTodoEditDesc(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button disabled={todoEditLoading} variant="danger" onClick={() => handleTodoDelete()}>Supprimer</Button>
            <Button disabled={todoEditLoading} onClick={() => handleTodoUpdate()}>{todoEditLoading ? 'En cours…' : 'Mettre à jour'}</Button>
            <Button disabled={todoEditLoading} variant="ghost" onClick={() => closeTodoEdit()}>Annuler</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
