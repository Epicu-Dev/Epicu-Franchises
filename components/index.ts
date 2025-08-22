// Composants de base
export { default as Header } from './header';
export { default as Navbar } from './navbar';
export { default as Sidebar } from './sidebar';
export { default as Counter } from './counter';
export { default as ThemeSwitch } from './theme-switch';

// Composants de modales
export { default as ProspectModal } from './prospect-modal';
export { default as PrestationModal } from './prestation-modal';
export { default as AgendaModals } from './agenda-modals';
export { default as HelpModal } from './help-modal';

// Composants de badges
export { 
  CategoryBadge, 
  StatusBadge, 
  Badge,
  getCategoryBadgeColor,
  getStatusBadgeColor 
} from './badges';

// Composants d'interface
export { default as MetricCard } from './metric-card';
export { default as MessageAlert } from './message-alert';
export { default as GlobalToastContainer } from './global-toast-container';
export { default as ToastContainer } from './toast-container';
export { default as ToastDemo } from './toast-demo';
export { default as ToastNotification } from './toast-notification';

// Composants de formulaire
export { StyledSelect } from './styled-select';

// Composants d'agenda
export { default as AgendaDropdown } from './agenda-dropdown';

// Utilitaires
export * from './primitives';
