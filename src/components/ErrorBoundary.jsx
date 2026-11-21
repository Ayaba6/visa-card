import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

/**
 * Filet de sécurité : si un écran plante, on affiche un message clair au lieu d'une page blanche.
 * Gère aussi le cas où un écran chargé à la demande n'est plus disponible après une mise à jour.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur non gérée :', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const outdated = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(
      this.state.error?.message || '',
    );

    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm w-full text-center">
          <span className="mx-auto w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TriangleAlert className="w-8 h-8" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-5">
            {outdated ? 'Une nouvelle version est disponible' : 'Oups, quelque chose s’est mal passé'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {outdated
              ? 'Rechargez la page pour utiliser la dernière version de Kodapay.'
              : 'Votre argent et vos données ne sont pas affectés. Rechargez la page pour continuer.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 h-12 px-6 rounded-2xl bg-emerald-600 text-white font-semibold inline-flex items-center gap-2 hover:bg-emerald-700"
          >
            <RefreshCw className="w-4 h-4" /> Recharger
          </button>
        </div>
      </div>
    );
  }
}
