import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  PlusCircle, 
  ArrowUpCircle, 
  Lock, 
  Unlock, 
  AlertCircle,
  ChevronDown 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function CardDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCard = location.state?.card;

  const [showDetails, setShowDetails] = useState(false);
  const [card, setCard] = useState(initialCard || {
    id: 'demo-1',
    card_name: 'Carte 01',
    card_number: '4288520000001601',
    expiry_date: '12/28',
    cvv: '321',
    balance_usd: 0.00,
    status: 'ACTIVE'
  });

  const [actionLoading, setActionLoading] = useState(false);

  const toggleBlockCard = async () => {
    try {
      setActionLoading(true);
      const newStatus = card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

      if (card.id !== 'demo-1') {
        const { error } = await supabase
          .from('virtual_cards')
          .update({ status: newStatus })
          .eq('id', card.id);

        if (error) throw error;
      }

      setCard((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert("Erreur de mise à jour : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isBlocked = card.status === 'BLOCKED';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* En-tête */}
      <div className="bg-blue-950 text-white p-4 flex items-center gap-4">
        <button onClick={() => navigate('/cards')} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Détail de la carte</h1>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Widget Solde USD */}
        <div className="text-center space-y-1">
          <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wider uppercase">
            SOLDE CARTES
          </span>
          <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-800">
            <span>{showDetails ? `$${Number(card.balance_usd).toFixed(2)}` : '****'} USD</span>
            <button onClick={() => setShowDetails(!showDetails)} className="text-slate-400 hover:text-slate-600">
              {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Ligne masquée d'information */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex justify-between items-center text-xs font-mono text-slate-600">
          <div>
            <span className="block text-[9px] text-slate-400 font-sans uppercase">Numéro de carte</span>
            <span>{showDetails ? card.card_number : '4288 52** **** 1601'}</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 font-sans uppercase">Exp Date</span>
            <span>{showDetails ? card.expiry_date : '**/**'}</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 font-sans uppercase">CVV</span>
            <span>{showDetails ? card.cvv : '***'}</span>
          </div>
        </div>

        {/* Visuel Carte bleu Money Fusion */}
        <div className="w-full h-48 rounded-2xl p-5 bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xl font-bold font-mono">
              {showDetails ? `$${Number(card.balance_usd).toFixed(2)}` : '****'} USD
            </span>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-emerald-400 text-xs font-bold">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
                <span>Money</span>
              </div>
              <span className="text-[10px] text-sky-200 tracking-wider">Fusion</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide font-sans mb-1">
              Ramodgwende Romaric Compaore
            </p>
            <p className="text-lg font-mono tracking-widest font-semibold">
              {showDetails ? card.card_number : '4288 52** **** 1601'}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex gap-4 text-[10px] font-mono">
              <div>
                <span className="block text-[8px] text-sky-200">EXP DATE</span>
                <span>{showDetails ? card.expiry_date : '**/**'}</span>
              </div>
              <div>
                <span className="block text-[8px] text-sky-200">CVV</span>
                <span>{showDetails ? card.cvv : '***'}</span>
              </div>
            </div>
            <span className="text-2xl font-black italic tracking-wider">VISA</span>
          </div>
        </div>

        {/* Actions 2x2 */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button 
            onClick={() => alert("Rechargement...")}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all shadow-sm"
          >
            <PlusCircle className="w-5 h-5 text-blue-900" />
            <span className="text-xs font-semibold text-slate-700">Recharger</span>
          </button>

          <button 
            onClick={() => alert("Retrait...")}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowUpCircle className="w-5 h-5 text-blue-900" />
            <span className="text-xs font-semibold text-slate-700">Retirer</span>
          </button>

          <button 
            onClick={toggleBlockCard}
            disabled={actionLoading}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all shadow-sm"
          >
            {isBlocked ? (
              <Unlock className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-500" />
            )}
            <span className="text-xs font-semibold text-slate-700">
              {isBlocked ? 'Débloquer' : 'Bloquer'}
            </span>
          </button>

          <button 
            onClick={() => alert("Détails de facturation...")}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all shadow-sm col-span-1"
          >
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">
              Détails de facturation
            </span>
          </button>
        </div>

        {/* Section Historiques */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-600">Type</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Historiques</h2>
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Aucun historique de transaction
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}