import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function CreateCardScreen() {
  const navigate = useNavigate();
  const [cardType, setCardType] = useState('VISA');
  const [cardName, setCardName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Fonction de génération d'un numéro de carte virtuel fictif
  const generateCardDetails = () => {
    const prefix = cardType === 'VISA' ? '4532' : '5412';
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const fullNumber = prefix + random12;
    const expMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expYear = String(new Date().getFullYear() + 3).slice(-2);
    const cvc = Math.floor(100 + Math.random() * 900).toString();

    return {
      card_number: fullNumber,
      expiry_date: `${expMonth}/${expYear}`,
      cvc: cvc
    };
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cardName.trim()) {
      setErrorMsg('Veuillez donner un nom à votre carte');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const generated = generateCardDetails();

      const { error } = await supabase
        .from('virtual_cards')
        .insert([
          {
            user_id: user.id,
            card_name: cardName.trim(),
            card_type: cardType,
            card_number: generated.card_number,
            expiry_date: generated.expiry_date,
            cvc: generated.cvc,
            balance: amount ? parseFloat(amount) : 0,
            status: 'active'
          }
        ]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/cards');
      }, 1500);

    } catch (err) {
      console.error("Erreur création carte:", err.message);
      setErrorMsg("Impossible de créer la carte. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-0 sm:py-6 sm:px-4">
      <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:h-[840px] bg-slate-50 flex flex-col relative sm:rounded-3xl sm:shadow-2xl overflow-hidden border-x border-slate-200 sm:border">
        
        {/* En-tête */}
        <header className="bg-emerald-950 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/cards')} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-100" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-wide">Nouvelle Carte</h1>
          </div>
        </header>

        {/* Corps de la page */}
        <main className="p-4 flex-1 space-y-5 overflow-y-auto pb-24">
          
          {/* APERÇU DYNAMIQUE DE LA CARTE */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl border border-emerald-600/30 flex flex-col justify-between h-48 relative overflow-hidden transition-all">
            <div className="flex justify-between items-start z-10">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-300 uppercase">
                {cardType} VIRTUAL
              </span>
              <CreditCard className="w-7 h-7 text-emerald-200/80" />
            </div>

            <div className="z-10 my-auto">
              <p className="text-xs text-emerald-200/70 mb-1 font-sans">Numéro de carte</p>
              <p className="font-mono text-lg tracking-widest font-bold">
                •••• •••• •••• {cardType === 'VISA' ? '4532' : '5412'}
              </p>
            </div>

            <div className="flex justify-between items-end z-10">
              <div>
                <p className="text-[10px] text-emerald-200/60 uppercase">Nom de la carte</p>
                <p className="text-sm font-semibold tracking-wide truncate max-w-[180px]">
                  {cardName || 'Ma Carte Kodapay'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-emerald-200/60 uppercase">Expire</p>
                <p className="text-xs font-mono font-semibold">12/29</p>
              </div>
            </div>

            {/* Arrière-plan décoratif */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleCreateCard} className="space-y-4">
            
            {/* Sélection Type de Carte */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Type de Carte
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['VISA', 'MASTERCARD'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardType(type)}
                    className={`py-3 px-4 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                      cardType === type
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Nom de la carte */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nom ou Usage
              </label>
              <input
                type="text"
                maxLength={24}
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Achats Online, Netflix..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              />
            </div>

            {/* Montant de recharge initial (optionnel) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Recharge Initiale (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 5000 (Optionnel)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              />
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold text-center animate-bounce">
                {errorMsg}
              </p>
            )}

            {/* Message de succès */}
            {success && (
              <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Carte créée avec succès !
              </div>
            )}

            {/* Bouton de confirmation */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 transition-all mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Générer ma carte virtuelle</span>
                </>
              )}
            </button>
          </form>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}