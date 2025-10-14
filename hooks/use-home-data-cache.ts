import { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import { useAuthFetch } from './use-auth-fetch';

// Types pour les données
type AgendaEvent = {
  id: string;
  task: string;
  date: string;
  type: string;
  description?: string;
  collaborators?: string[];
};

type TodoItem = {
  id: string;
  name: string;
  createdAt: string;
  dueDate?: string;
  status: string;
  type: string;
  description?: string;
  collaborators?: string[];
};

type Invoice = {
  id: string;
  nomEtablissement?: string;
  dateEmission: string;
  montant?: number;
  datePaiement?: string;
};

// Interface pour le cache
interface CacheData {
  agenda: AgendaEvent[];
  todos: TodoItem[];
  invoices: Invoice[];
  lastFetch: number;
  monthKey: string;
}

// Hook pour gérer le cache des données home
export const useHomeDataCache = () => {
  const { authFetch } = useAuthFetch();
  
  // État du cache
  const [cache, setCache] = useState<CacheData | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [todoLoading, setTodoLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
  // Ref pour éviter les requêtes multiples
  const fetchingRef = useRef(false);
  
  // Générer une clé unique pour le mois en cours (toujours le mois actuel)
  const getCurrentMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  // Vérifier si le cache est valide (toujours valide une fois chargé)
  const isCacheValid = useCallback(() => {
    if (!cache) return false;
    
    // Le cache est valide s'il existe (pas de limite de temps)
    return true;
  }, [cache]);
  
  // Fonction pour récupérer les données agenda (toujours pour le mois en cours)
  const fetchAgenda = useCallback(async (): Promise<AgendaEvent[]> => {
    try {
      setAgendaLoading(true);
      
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) return [];
      
      // Toujours utiliser le mois en cours
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const params = new URLSearchParams();
      params.set('dateStart', startOfMonth.toISOString().split('T')[0]);
      params.set('dateEnd', endOfMonth.toISOString().split('T')[0]);
      
      const eventsResponse = await authFetch(`/api/agenda?${params.toString()}`);
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        return eventsData.events || [];
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'agenda:', error);
      return [];
    } finally {
      setAgendaLoading(false);
    }
  }, [authFetch]);
  
  // Fonction pour récupérer les données todo (toujours pour le mois en cours)
  const fetchTodos = useCallback(async (): Promise<TodoItem[]> => {
    try {
      setTodoLoading(true);
      
      const meRes = await authFetch('/api/auth/me');
      if (!meRes.ok) return [];
      
      // Toujours utiliser le mois en cours
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const params = new URLSearchParams();
      const todosResponse = await authFetch(`/api/todo?${params.toString()}`);
      
      if (todosResponse.ok) {
        const todosData = await todosResponse.json();
        
        // Filtrer les todos côté client pour la plage de dates
        const filteredTodos = todosData.todos?.filter((todo: TodoItem) => {
          if (!todo.dueDate) return true;
          
          const todoDate = new Date(todo.dueDate);
          return todoDate >= startOfMonth && todoDate <= endOfMonth;
        }) || [];
        
        return filteredTodos;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des todos:', error);
      return [];
    } finally {
      setTodoLoading(false);
    }
  }, [authFetch]);
  
  // Fonction pour récupérer les factures (toujours pour le mois en cours)
  const fetchInvoices = useCallback(async (): Promise<Invoice[]> => {
    try {
      setInvoicesLoading(true);
      
      // Toujours utiliser le mois en cours
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      
      const params = new URLSearchParams();
      params.set("status", "payee");
      params.set("offset", "0");
      params.set("sortField", "datePaiement");
      params.set("sortDirection", "desc");
      
      const response = await authFetch(`/api/facturation?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        const list: Invoice[] = data.invoices || [];
        
        // Filtrer les factures par date de paiement pour le mois en cours
        const filtered = list.filter((inv) => {
          if (!inv.datePaiement) return false;
          
          const d = new Date(inv.datePaiement);
          return d >= startOfMonth && d <= endOfMonth;
        });
        
        return filtered;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      return [];
    } finally {
      setInvoicesLoading(false);
    }
  }, [authFetch]);
  
  // Fonction principale pour charger les données
  const loadData = useCallback(async (forceRefresh = false) => {
    const monthKey = getCurrentMonthKey();
    
    // Si le cache est valide et qu'on ne force pas le refresh, utiliser le cache
    if (!forceRefresh && isCacheValid() && cache) {
      return {
        agenda: cache.agenda,
        todos: cache.todos,
        invoices: cache.invoices,
        fromCache: true
      };
    }
    
    // Éviter les requêtes multiples
    if (fetchingRef.current) {
      return null;
    }
    
    fetchingRef.current = true;
    
    try {
      // Charger toutes les données en parallèle (toujours pour le mois en cours)
      const [agenda, todos, invoices] = await Promise.all([
        fetchAgenda(),
        fetchTodos(),
        fetchInvoices()
      ]);
      
      // Mettre à jour le cache
      const newCache: CacheData = {
        agenda,
        todos,
        invoices,
        lastFetch: Date.now(),
        monthKey
      };
      
      setCache(newCache);
      
      return {
        agenda,
        todos,
        invoices,
        fromCache: false
      };
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, [getCurrentMonthKey, isCacheValid, cache, fetchAgenda, fetchTodos, fetchInvoices]);
  
  // Fonction pour forcer le rechargement
  const refreshData = useCallback(() => {
    return loadData(true);
  }, [loadData]);
  
  // Charger les données seulement au montage initial
  useEffect(() => {
    loadData();
  }, []); // Suppression de la dépendance loadData pour éviter les rechargements
  
  return {
    // Données du cache
    agenda: cache?.agenda || [],
    todos: cache?.todos || [],
    invoices: cache?.invoices || [],
    
    // États de chargement
    agendaLoading,
    todoLoading,
    invoicesLoading,
    isLoading: agendaLoading || todoLoading || invoicesLoading,
    
    // Fonctions
    refreshData,
    loadData,
    
    // Informations sur le cache
    isFromCache: cache ? isCacheValid() : false,
    lastFetch: cache?.lastFetch || null
  };
};
