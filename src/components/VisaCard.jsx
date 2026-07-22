import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  PlusCircle, 
  Lock, 
  Unlock, 
  History,
  Loader2 
} from 'lucide-react';
import { supabase } from '../supabaseClient'; // Vérifie bien le chemin vers ton client Supabase

export default function VisaCard({ cardData: initialCardData }) {
  const [showDetails, setShowDetails] = useState(false);
  const [card, setCard] = useState(initialCardData || null);
  const [loading, setLoading] = useState(!initialCardData);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Charger la carte depuis Supabase si elle n'est pas passée en props
  useEffect(() => {
    if (initialCardData) {
      setCard(initialCardData);
      setLoading(false);
      return;
    }

    async function fetchCard() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) setCard(data);
      } catch (err) {
        console.error("Erreur de chargement de la carte :", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [initialCardData]);

  // 2. Action Bloquer / Débloquer dans Supabase
  const toggleBlockCard = async () => {
    if (!card?.id) return;

    try {
      setActionLoading(true);
      const newStatus = card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

      const { error } = await supabase
        .from('cards')
        .update({ status: newStatus })
        .eq('id', card.id);

      if (error) throw error;

      setCard((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert("Impossible de modifier le statut : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Extraction des variables avec valeurs par défaut
  const {
    cardNumber = "4000 1234 5678 9010",
    cardHolder = "CLIENT VALIDE",
    expiry = "12/28",
    cvv = "321",
    balanceUsd = 15.00,
    balanceFcfa = balanceUsd * 650, // Calcul auto si non fourni
    status = "ACTIVE"
  } = card || {};

  const isActive = status === 'ACTIVE';

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Chargement de votre carte...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {/* En-tête de page */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Mes Cartes Visa</h1>
        <p className="text-xs text-slate-400 mt-1">Gérez vos paiements en ligne en toute sécurité</p>
      </div>

      {/* Container de la carte avec dégradé moderne */}
      <div className="relative w-full h-56 rounded-2xl p-6 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white shadow-2xl overflow-hidden border border-slate-700/50">
        
        {/* Motif d'arrière-plan discret */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* En-tête de la carte : Puce + Statut + Logo Visa */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            {/* Puce dorée */}
            <div className="w-11 h-8 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-md shadow-inner flex items-center justify-center">
              <div className="w-7 h-5 border border-amber-600/40 rounded-sm" />
            </div>

            {/* Badge de statut dynamique */}
            <span className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              isActive 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {isActive ? (
                <>
                  <ShieldCheck className="w-3 h-3" /> ACTIVE
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" /> BLOQUÉE
                </>
              )}
            </span>
          </div>
          
          <span className="text-2xl font-black italic tracking-wider text-white">
            VISA
          </span>
        </div>

        {/* Numéro de la carte */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Numéro de carte</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-mono tracking-wider font-semibold">
              {showDetails 
                ? cardNumber 
                : `•••• •••• •••• ${cardNumber.slice(-4)}`}
            </p>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300"
              title={showDetails ? "Masquer" : "Afficher"}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bas de carte : Titulaire, Date, CVV */}
        <div className="flex justify-between items-end text-xs">
          <div>
            <p className="text-slate-400 uppercase tracking-widest text-[10px]">Titulaire</p>
            <p className="font-medium tracking-wide text-sm font-mono uppercase">{cardHolder}</p>
          </div>
          
          <div className="flex gap-4">
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[10px]">Expire</p>
              <p className="font-medium font-mono text-sm">{expiry}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-widest text-[10px]">CVV</p>
              <p className="font-medium font-mono text-sm">
                {showDetails ? cvv : "•••"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget du solde de la carte */}
      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-white shadow-lg">
        <div>
          <p className="text-xs text-slate-400">Solde de la carte</p>
          <p className="text-xl font-bold text-emerald-400">${Number(balanceUsd).toFixed(2)} USD</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Valeur estimée</p>
          <p className="text-sm font-semibold text-slate-200">~ {Math.round(balanceFcfa).toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Boutons d'action rapides */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <button 
          onClick={() => alert("Redirection vers la page de rechargement...")}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 p-3 rounded-xl flex flex-col items-center gap-1.5 text-white transition-all group"
        >
          <PlusCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Recharger</span>
        </button>

        <button 
          onClick={toggleBlockCard}
          disabled={actionLoading}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 p-3 rounded-xl flex flex-col items-center gap-1.5 text-white transition-all group disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          ) : isActive ? (
            <Lock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Unlock className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-medium">{isActive ? 'Bloquer' : 'Débloquer'}</span>
        </button>

        <button 
          onClick={() => alert("Ouverture de l'historique...")}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 p-3 rounded-xl flex flex-col items-center gap-1.5 text-white transition-all group"
        >
          <History className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Historique</span>
        </button>
      </div>
    </div>
  );
}