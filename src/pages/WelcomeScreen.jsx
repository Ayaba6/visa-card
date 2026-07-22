import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col justify-between p-6 relative overflow-hidden text-slate-800">
      {/* Motif décoratif en haut à gauche */}
      <div className="absolute -top-10 -left-10 w-48 h-48 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-emerald-700 w-full h-full">
          <path d="M0 20 Q 50 10, 80 80" strokeWidth="4" />
          <path d="M0 40 Q 40 30, 60 90" strokeWidth="4" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 mt-12">
        {/* Titre avec la marque Kodapay */}
        <h1 className="text-3xl font-extrabold text-emerald-950 mb-4 tracking-tight">
          Kodapay
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed max-w-xs mb-8">
          Gérez vos paiements en ligne en toute simplicité, où que vous soyez. Que vous vendiez, achetiez ou transfériez, <strong>Kodapay</strong> vous accompagne. Inscription gratuite en quelques clics.
        </p>

        {/* Bouton Principal Vert Clair / Émeraude */}
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
        >
          <span>Se connecter</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Lien vers Inscription */}
        <div className="mt-8 text-xs text-slate-500">
          Vous n'avez pas de compte ?{' '}
          <button
            onClick={() => navigate('/register')}
            className="block w-full mt-2 font-bold text-emerald-800 text-sm hover:underline"
          >
            Inscription
          </button>
        </div>
      </div>

      {/* Motif décoratif en bas à droite */}
      <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-emerald-700 w-full h-full">
          <path d="M20 100 Q 80 50, 100 0" strokeWidth="6" />
          <path d="M40 100 Q 90 60, 100 20" strokeWidth="6" />
        </svg>
      </div>
    </div>
  );
}