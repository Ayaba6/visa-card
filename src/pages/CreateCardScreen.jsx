import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function CreateCardScreen() {
  const navigate = useNavigate();

  // États du formulaire
  const [cardType, setCardType] = useState('VISA'); // VISA ou MASTERCARD
  const [cardName, setCardName] = useState(''); // Nom sur la carte
  const [initialAmount, setInitialAmount] = useState(''); // Montant de recharge initial (FCFA)
  const [profile, setProfile] = useState(null);

  // États de chargement et d'erreur
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Taux de conversion indicatif (ex: 1 USD = 650 FCFA)
  const EXCHANGE_RATE = 650;
  // Frais de création de la carte (ex: 1000 FCFA)
  const CARD_CREATION_FEE = 1000;

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
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Erreur chargement profil:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  // Générateur de détails avec espaces dans le numéro et CVV
  const generateCardDetails = () => {
    const prefix = cardType === 'VISA' ? '4111' : '5500';
    
    // Génère 3 groupes de 4 chiffres aléatoires
    const group2 = Math.floor(1000 + Math.random() * 9000).toString();
    const group3 = Math.floor(1000 + Math.random() * 9000).toString();
    const group4 = Math.floor(1000 + Math.random() * 9000).toString();

    // Numéro formaté avec des espaces : "XXXX XXXX XXXX XXXX"
    const cardNumberFormatted = `${prefix} ${group2} ${group3} ${group4}`;
    
    // Date d'expiration (3 ans dans le futur)
    const now = new Date();
    const expMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expYear = String((now.getFullYear() + 3) % 100).padStart(2, '0');
    const expiryDate = `${expMonth}/${expYear}`;
    
    // Génération du CVV à 3 chiffres
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    return { cardNumber: cardNumberFormatted, expiryDate, cvv };
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const reloadFcfa = parseFloat(initialAmount) || 0;
    const totalDeduction = reloadFcfa + CARD_CREATION_FEE;

    // Vérifications de solde
    if (reloadFcfa < 3000) {
      setErrorMsg("Le rechargement initial minimum est de 3 000 FCFA.");
      return;
    }

    if ((profile?.balance_fcfa ?? 0) < totalDeduction) {
      setErrorMsg(`Solde principal insuffisant. Il vous faut au total ${totalDeduction.toLocaleString()} FCFA (${reloadFcfa.toLocaleString()} FCFA de rechargement + ${CARD_CREATION_FEE.toLocaleString()} FCFA de frais).`);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée");

      // 1. Générer les informations de la carte
      const { cardNumber, expiryDate, cvv } = generateCardDetails();
      const initialBalanceUsd = parseFloat((reloadFcfa / EXCHANGE_RATE).toFixed(2));

      // 2. Insérer la nouvelle carte virtuelle dans Supabase
      const { data: newCard, error: cardError } = await supabase
        .from('virtual_cards')
        .insert([
          {
            user_id: user.id,
            card_holder: cardName.trim() || `${profile?.first_name || 'TITULAIRE'} ${profile?.last_name || ''}`.trim(),
            card_number: cardNumber, // Enregistré avec les espaces
            expiry_date: expiryDate,
            cvv: cvv,                 // Stocké sous la colonne 'cvv'
            brand: cardType,
            balance_usd: initialBalanceUsd,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (cardError) throw cardError;

      // 3. Déduire le montant du solde principal de l'utilisateur
      const newMainBalance = profile.balance_fcfa - totalDeduction;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_fcfa: newMainBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Enregistrer la transaction
      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'VIRTUAL_CARD_CREATION',
          amount_fcfa: totalDeduction,
          description: `Création de carte virtuelle ${cardType} (+ $${initialBalanceUsd})`,
          status: 'SUCCESS',
          created_at: new Date().toISOString()
        }
      ]);

      alert(`Votre carte virtuelle ${cardType} a été créée avec succès avec un solde de $${initialBalanceUsd} !`);
      navigate('/cards');
    } catch (err) {
      console.error("Erreur lors de la création de la carte:", err);
      setErrorMsg("Une erreur s'est produite : " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    );
  }

  const reloadFcfaNum = parseFloat(initialAmount) || 0;
  const estimatedUsd = (reloadFcfaNum / EXCHANGE_RATE).toFixed(2);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-10">
      {/* En-tête */}
      <div className="bg-emerald-950 text-white p-4 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-emerald-100" />
        </button>
        <h1 className="text-lg font-semibold">Nouvelle Carte Virtuelle</h1>
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-6">

        {/* Aperçu visuel de la carte */}
        <div className={`w-full h-48 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl transition-all ${
          cardType === 'VISA' 
            ? 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-emerald-900 border border-indigo-500/30' 
            : 'bg-gradient-to-tr from-red-950 via-amber-950 to-emerald-950 border border-amber-500/30'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] tracking-widest text-emerald-300 uppercase font-semibold">CARTE VIRTUELLE</p>
              <p className="text-xs text-slate-300 font-medium">Rechargeable</p>
            </div>
            <span className="text-lg font-black italic tracking-wider">
              {cardType === 'VISA' ? 'VISA' : 'Mastercard'}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-300">Solde estimé</p>
            <p className="text-2xl font-mono font-bold text-white">
              ${initialAmount ? estimatedUsd : '0.00'} <span className="text-xs font-normal text-slate-400">USD</span>
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] text-slate-400 uppercase">Titulaire</p>
              <p className="text-sm font-semibold tracking-wide uppercase">
                {cardName.trim() || `${profile?.first_name || 'VOTRE'} ${profile?.last_name || 'NOM'}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase">Exp / CVV</p>
              <p className="text-xs font-mono text-slate-300">••/•• •••</p>
            </div>
          </div>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleCreateCard} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 space-y-5">
          
          {/* 1. Sélection du réseau */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Choisissez le réseau
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCardType('VISA')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  cardType === 'VISA'
                    ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-2 ring-emerald-700/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-sm">Visa</span>
                {cardType === 'VISA' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              </button>

              <button
                type="button"
                onClick={() => setCardType('MASTERCARD')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  cardType === 'MASTERCARD'
                    ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-2 ring-emerald-700/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-sm">Mastercard</span>
                {cardType === 'MASTERCARD' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              </button>
            </div>
          </div>

          {/* 2. Nom sur la carte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. Nom à afficher sur la carte
            </label>
            <input
              type="text"
              placeholder="ex: Jean Dupont"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-700 transition-colors"
            />
          </div>

          {/* 3. Rechargement initial */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Rechargement initial (FCFA)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Solde : {profile?.balance_fcfa?.toLocaleString() ?? 0} FCFA
              </span>
            </div>
            <input
              type="number"
              placeholder="ex: 10000"
              min="3000"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-700 transition-colors"
            />
            {initialAmount > 0 && (
              <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Vous recevrez environ : <span className="font-bold font-mono text-sm">${estimatedUsd} USD</span>
              </p>
            )}
          </div>

          {/* Résumé des frais */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Frais de création de la carte :</span>
              <span className="font-semibold text-slate-800">{CARD_CREATION_FEE.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Montant rechargé :</span>
              <span className="font-semibold text-slate-800">{reloadFcfaNum.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Total prélevé du solde :</span>
              <span className="text-emerald-800">{(reloadFcfaNum + CARD_CREATION_FEE).toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Message d'erreur */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bouton de confirmation */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Génération de la carte en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Créer et activer la carte</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}