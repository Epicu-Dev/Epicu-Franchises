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
export { HelpModal } from './help-modal';
export { default as ResourceModal } from './resource-modal';

// Composants de badges
export { 
  CategoryBadge, 
  StatusBadge, 
  Badge,
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

// Composants d'agenda
export { AgendaDropdown } from './agenda-dropdown';

// Utilitaires
export * from './primitives';
