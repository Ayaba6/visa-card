import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Eye, 
  EyeOff, 
  CreditCard, 
  ArrowLeftRight, 
  ArrowDownCircle, 
  Store, 
  Link as LinkIcon, 
  Headphones,
  Lock,
  UserPlus,
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gestion des modales et du PIN
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Chargement du profil utilisateur connecté
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.pin_code) {
          setProfile(data);
          setIsCreatingAccount(false);
        } else {
          setProfile(data);
          setIsCreatingAccount(true);
        }
      } catch (err) {
        console.error("Erreur chargement profil:", err.message);
        setIsCreatingAccount(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  const balanceFcfa = profile?.balance_fcfa ?? 0;
  const paymentCardFcfa = profile?.payment_card_fcfa ?? 0;
  const cashbackFcfa = profile?.cashback_fcfa ?? 0;

  // Action du clic sur l'œil (masquer/afficher)
  const handleToggleBalance = () => {
    if (showBalance) {
      setShowBalance(false);
    } else {
      setPinInput('');
      setConfirmPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  // Soumission du formulaire PIN (Création ou Vérification)
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    if (isCreatingAccount) {
      if (pinInput.length < 4) {
        setPinError('Le code PIN doit contenir au moins 4 chiffres');
        return;
      }
      if (pinInput !== confirmPinInput) {
        setPinError('Les deux codes PIN ne correspondent pas');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('profiles')
          .upsert([{ id: user.id, pin_code: pinInput, balance_fcfa: balanceFcfa }])
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        setIsCreatingAccount(false);
        setShowBalance(true);
        setIsPinModalOpen(false);
      } catch (err) {
        console.error("Erreur création profil:", err.message);
        setPinError("Impossible de définir le code PIN. Réessayez.");
      }
    } else {
      if (pinInput === profile?.pin_code) {
        setShowBalance(true);
        setIsPinModalOpen(false);
      } else {
        setPinError('Code PIN incorrect');
      }
    }
  };

  const quickActions = [
    { label: 'Paiement', icon: CreditCard, action: () => alert('Action Paiement') },
    { label: 'Transfert', icon: ArrowLeftRight, action: () => alert('Action Transfert') },
    { label: 'Dépôt', icon: ArrowDownCircle, action: () => alert('Action Dépôt') },
    { label: 'Boutique', icon: Store, action: () => alert('Action Boutique') },
    { label: 'Lien', icon: LinkIcon, action: () => alert('Action Lien') },
    { label: 'Carte virtuelle', icon: CreditCard, action: () => navigate('/cards') },
  ];

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative overflow-y-auto min-h-screen pb-20">
      {/* En-tête Vert Émeraude Profond */}
      <div className="bg-emerald-950 text-white p-4 flex justify-between items-center shadow-sm">
        <button onClick={() => navigate('/settings')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <SettingsIcon className="w-6 h-6 text-emerald-100" />
        </button>
        <h1 className="text-lg font-semibold tracking-wide">Solde</h1>
        <button onClick={() => navigate('/notifications')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-emerald-100" />
        </button>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Carte de solde Vert Émeraude Principal */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-600/40">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                SOLDE PRINCIPAL
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono">
                  {showBalance ? balanceFcfa.toLocaleString() : '••••••'}
                </span>
                <span className="text-sm font-semibold text-emerald-200">FCFA</span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">XOF</p>
            </div>
            <button 
              onClick={handleToggleBalance} 
              className="p-1.5 hover:bg-emerald-800/60 rounded-lg text-emerald-100 transition-colors"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-emerald-600/50">
            <div className="bg-emerald-950/40 p-2.5 rounded-xl flex justify-between items-center border border-emerald-500/20">
              <div>
                <p className="text-[10px] text-emerald-200/90 uppercase font-semibold">PAIEMENT VIA CARTE</p>
                <p className="text-sm font-bold mt-0.5">
                  {showBalance ? `${paymentCardFcfa.toLocaleString()} FCFA` : '••••'}
                </p>
              </div>
              <Eye className="w-4 h-4 text-emerald-300/60" />
            </div>

            <div className="bg-emerald-950/40 p-2.5 rounded-xl flex justify-between items-center border border-emerald-500/20">
              <div>
                <p className="text-[10px] text-emerald-200/90 uppercase font-semibold">CASHBACK</p>
                <p className="text-sm font-bold mt-0.5">
                  {showBalance ? `${cashbackFcfa.toLocaleString()} FCFA` : '••••'}
                </p>
              </div>
              <Eye className="w-4 h-4 text-emerald-300/60" />
            </div>
          </div>
        </div>

        {/* Grille des raccourcis 3x2 */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={act.action}
                className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50/50 active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton Support Flottant */}
      <button 
        onClick={() => alert("Prise de contact avec le support client...")}
        className="fixed bottom-20 right-4 w-12 h-12 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all z-20"
      >
        <Headphones className="w-6 h-6" />
      </button>

      {/* MODALE PIN : Création ou Saisie */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl border border-emerald-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
              {isCreatingAccount ? <UserPlus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              {isCreatingAccount ? "Créer votre code PIN" : "Saisissez votre PIN"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {isCreatingAccount 
                ? "Définissez un code PIN secret pour sécuriser l'affichage de votre solde" 
                : "Entrez votre code PIN pour afficher le solde"}
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={isCreatingAccount ? "Nouveau PIN" : "••••"}
                  className="w-full text-center text-xl tracking-[0.3em] font-mono py-2 border-b-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
                  autoFocus
                />
              </div>

              {isCreatingAccount && (
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Confirmer PIN"
                    className="w-full text-center text-xl tracking-[0.3em] font-mono py-2 border-b-2 border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              {pinError && (
                <p className="text-xs text-red-500 font-semibold pt-1">{pinError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-slate-600 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
                >
                  {isCreatingAccount ? "Créer" : "Valider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}