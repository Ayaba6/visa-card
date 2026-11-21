import { useEffect, useState, useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------ */
/* Service worker                                                      */
/* ------------------------------------------------------------------ */

/** Enregistre le service worker en production uniquement (en développement il gênerait le rechargement à chaud). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker non enregistré :', err));
  });
}

/* ------------------------------------------------------------------ */
/* Installation de l'application                                       */
/* ------------------------------------------------------------------ */

// L'événement « beforeinstallprompt » arrive tôt : on le capture dès le chargement du module.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/**
 * État de l'installation :
 * - installed : l'app est déjà ouverte comme application installée
 * - canPrompt : le navigateur propose l'installation en un clic (Chrome, Edge, Android)
 * - ios : iPhone/iPad, où l'installation se fait via « Partager → Sur l'écran d'accueil »
 */
export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt = null;
    notify();
    return outcome === 'accepted';
  };

  return { installed: isStandalone(), canPrompt: !!prompt, ios: isIOS(), install };
}

/* ------------------------------------------------------------------ */
/* Connexion réseau                                                    */
/* ------------------------------------------------------------------ */

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
