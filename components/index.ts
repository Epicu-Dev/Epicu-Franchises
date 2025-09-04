// Composants de base
export { Header } from './header';
export { Navbar } from './navbar';
export { Sidebar } from './sidebar';
export { Counter } from './counter';
export { ThemeSwitch } from './theme-switch';

// Composants de modales
export { ProspectModal } from './prospect-modal';
export { PrestationModal } from './prestation-modal';
export { AgendaModals } from './agenda-modals';
export { EventModal } from './event-modal';
export { HelpModal } from './help-modal';
export { default as ResourceModal } from './resource-modal';
export { FranchiseTeamModal } from './franchise-team-modal';
export { UnifiedEventModal } from './unified-event-modal';
export { SubscribersEditModal } from './subscribers-edit-modal';
export { default as InvoiceModal } from './invoice-modal';
export { default as PublicationModal } from './publication-modal';
export { default as SlotSelectionModal } from './slot-selection-modal';
export { default as PublicationDetails } from './publication-details';

// Composants de badges
export { 
  CategoryBadge, 
  StatusBadge, 
  Badge,
  AgendaBadge,
  TodoBadge,
  getCategoryBadgeColor,
  getStatusBadgeColor 
} from './badges';

// Composants d'interface
export { MetricCard } from './metric-card';
export { default as MessageAlert } from './message-alert';
export { default as GlobalToastContainer } from './global-toast-container';
export { default as ToastContainer } from './toast-container';
export { default as ToastDemo } from './toast-demo';
export { default as ToastNotification } from './toast-notification';

// Composants de formulaire
export { StyledSelect } from './styled-select';
export { FormLabel } from './form-label';

// Composants de tableau
export { SortableColumnHeader } from './sortable-column-header';

// Composants d'agenda
export { AgendaDropdown } from './agenda-dropdown';
export { AgendaSection } from './agenda-section';

// Utilitaires
export * from './primitives';
