import { createContext } from 'react';

// Objets de contexte isolés dans un fichier sans composant : ils gardent la même
// identité lors des rechargements à chaud (HMR) de Vite pendant le développement.
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const PinContext = createContext(null);
