import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  PlusCircle, 
  ArrowUpCircle, 
  Lock, 
  Unlock, 
  AlertCircle,
  ChevronDown,
  X,
  Wallet
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function CardDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCard = location.state?.card;

  const [showDetails, setShowDetails] = useState(false);
  const [card, setCard] = useState(() => initialCard || {
    id: 'demo-1',
    card_name: 'Carte 01',
    card_holder: 'Jean Dupont', // Utilisation de card_holder comme en base de données
    card_number: '4111797362715760',
    expiry_date: '07/29',
    cvv: '321',
    balance_usd: 15.38,
    status: 'ACTIVE'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // État du Solde Principal (Wallet du compte utilisateur)
  const [userWalletBalanceFcfa, setUserWalletBalanceFcfa] = useState(0);
  
  // Modal de Rechargement
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [amountFcfa, setAmountFcfa] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('balance_fcfa')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setUserWalletBalanceFcfa(data.balance_fcfa || 0);
    } catch (err) {
      console.error("Erreur lors de la récupération du solde wallet :", err.message);
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!card?.id || card.id === 'demo-1') return;
    
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Erreur chargement transactions :", err.message);
    } finally {
      setTxLoading(false);
    }
  }, [card?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  // Rechargement depuis le Solde du Compte (Wallet)
  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const fcfa = parseFloat(amountFcfa);

    if (!fcfa || fcfa < 500) {
      alert("Le montant minimum de rechargement est de 500 FCFA.");
      return;
    }

    if (fcfa > userWalletBalanceFcfa && card.id !== 'demo-1') {
      alert("Solde principal insuffisant pour effectuer ce rechargement.");
      return;
    }

    setTopUpLoading(true);

    try {
      const addedUsd = Number((fcfa / 650).toFixed(2)); // Taux aligné avec CreateCardScreen (1 USD = 650 FCFA)
      const currentBalance = Number(card.balance_usd) || 0;
      const newUsdBalance = Number((currentBalance + addedUsd).toFixed(2));
      const newWalletBalance = userWalletBalanceFcfa - fcfa;

      if (card.id !== 'demo-1') {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Déduire du solde utilisateur (Wallet)
        const { error: walletError } = await supabase
          .from('profiles')
          .update({ balance_fcfa: newWalletBalance })
          .eq('id', user.id);

        if (walletError) throw walletError;

        // 2. Créditer la carte virtuelle
        const { error: cardError } = await supabase
          .from('virtual_cards')
          .update({ balance_usd: newUsdBalance })
          .eq('id', card.id);

        if (cardError) throw cardError;

        // 3. Ajouter l'enregistrement dans la table transactions
        const { error: txError } = await supabase
          .from('transactions')
          .insert([
            {
              card_id: card.id,
              user_id: user.id,
              type: 'TOPUP',
              amount_fcfa: fcfa,
              amount_usd: addedUsd,
              operator: 'SOLDE PRINCIPAL',
              status: 'SUCCESS',
              created_at: new Date().toISOString()
            }
          ]);

        if (txError) throw txError;
      }

      setCard((prev) => ({ ...prev, balance_usd: newUsdBalance }));
      setUserWalletBalanceFcfa(newWalletBalance);
      setShowTopUpModal(false);
      setAmountFcfa('');
      
      if (card.id !== 'demo-1') {
        fetchTransactions();
      }
      
      alert(`Carte rechargée avec succès ! +$${addedUsd} USD (${fcfa.toLocaleString('fr-FR')} FCFA déduits du solde principal).`);

    } catch (err) {
      alert("Erreur lors du rechargement : " + err.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const isBlocked = card.status === 'BLOCKED';
  const numericBalance = Number(card.balance_usd) || 0;
  
  // Récupération prioritaire de `card_holder`
  const cardHolderName = card.card_holder || card.card_holder_name || card.holder_name || card.name || 'Nom du porteur';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen relative pb-16">
      {/* En-tête */}
      <div className="bg-blue-950 text-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
        <button onClick={() => navigate('/cards')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Détail de la carte</h1>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Solde Carte */}
        <div className="text-center space-y-1">
          <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wider uppercase">
            SOLDE CARTE
          </span>
          <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-800">
            <span>{showDetails ? `$${numericBalance.toFixed(2)}` : '****'} USD</span>
            <button onClick={() => setShowDetails(!showDetails)} className="text-slate-400 hover:text-slate-600 transition-colors">
              {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Détails numéros */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex justify-between items-center text-xs font-mono text-slate-600">
          <div>
            <span className="block text-[9px] text-slate-400 font-sans uppercase">Numéro de carte</span>
            <span>{showDetails ? card.card_number : '4111 79** **** 5760'}</span>
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

        {/* Visuel Carte */}
        <div className={`w-full h-48 rounded-2xl p-5 bg-gradient-to-r ${isBlocked ? 'from-slate-700 to-slate-900' : 'from-blue-900 via-blue-700 to-sky-500'} text-white shadow-xl relative overflow-hidden flex flex-col justify-between transition-all`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-bold font-mono">
              {showDetails ? `$${numericBalance.toFixed(2)}` : '****'} USD
            </span>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-emerald-400 text-xs font-bold">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
                <span>KODAPAY</span>
              </div>
            </div>
          </div>

          <div>
            {/* Nom dynamique récupéré depuis card.card_holder */}
            <p className="text-sm font-semibold tracking-wide font-sans mb-1 uppercase">
              {cardHolderName}
            </p>
            <p className="text-lg font-mono tracking-widest font-semibold">
              {showDetails ? card.card_number : '4111 79** **** 5760'}
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
            <span className="text-2xl font-black italic tracking-wider">
              {card.brand || 'VISA'}
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <button 
            onClick={() => setShowTopUpModal(true)}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <PlusCircle className="w-5 h-5 text-blue-900" />
            <span className="text-[11px] font-semibold text-slate-700">Recharger</span>
          </button>

          <button 
            onClick={() => alert("Fonctionnalité de retrait disponible bientôt.")}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <ArrowUpCircle className="w-5 h-5 text-blue-900" />
            <span className="text-[11px] font-semibold text-slate-700">Retirer</span>
          </button>

          <button 
            onClick={toggleBlockCard}
            disabled={actionLoading}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {isBlocked ? (
              <Unlock className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-500" />
            )}
            <span className="text-[11px] font-semibold text-slate-700">
              {isBlocked ? 'Débloquer' : 'Bloquer'}
            </span>
          </button>

          <button 
            onClick={() => alert("Adresse de facturation : Adresse virtuelle disponible sur votre profil.")}
            className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <span className="text-[11px] font-semibold text-slate-700">Facturation</span>
          </button>
        </div>

        {/* Historique */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-slate-800">Historiques</h2>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {txLoading ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              Aucun historique de transaction
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      ↓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Rechargement ({tx.operator || 'Solde'})</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-emerald-600">+{Number(tx.amount_fcfa)?.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-[9px] text-slate-400">(+${Number(tx.amount_usd).toFixed(2)} USD)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RECHARGEMENT */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Recharger depuis le Solde</h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Wallet className="w-5 h-5 text-blue-900" />
                <span className="text-xs font-medium">Solde principal dispo:</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">
                {userWalletBalanceFcfa.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Montant à transférer sur la carte (FCFA)</label>
                <input
                  type="number"
                  placeholder="ex: 5000"
                  value={amountFcfa}
                  onChange={(e) => setAmountFcfa(e.target.value)}
                  min="500"
                  max={userWalletBalanceFcfa}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-900 transition-colors"
                />
                {parseFloat(amountFcfa) > 0 && (
                  <div className="flex justify-between items-center text-[11px] font-bold mt-1.5">
                    <span className="text-emerald-600">
                      ≈ ${(parseFloat(amountFcfa) / 650).toFixed(2)} USD ajoutés sur la carte
                    </span>
                    {parseFloat(amountFcfa) > userWalletBalanceFcfa && (
                      <span className="text-red-500 font-normal">Solde insuffisant</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={topUpLoading || parseFloat(amountFcfa) > userWalletBalanceFcfa}
                className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-sm transition-all shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {topUpLoading ? 'Mise à jour du solde...' : 'Confirmer le rechargement'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}