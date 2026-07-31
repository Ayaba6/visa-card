import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Ajustez le chemin selon votre projet

export default function TopUpModal({ card, onClose, onSuccess }) {
  const [operator, setOperator] = useState('Orange Money');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Veuillez entrer un montant valide.');
      setLoading(false);
      return;
    }

    try {
      // 1. Appel de notre API local/backend de simulation
      const response = await fetch('http://localhost:4000/api/cards/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          amount: numericAmount,
          operator,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du rechargement');
      }

      // 2. Mise à jour du solde dans la base de données Supabase
      const { error: dbError } = await supabase
        .from('virtual_cards')
        .update({ balance: data.card.balance })
        .eq('id', card.id);

      if (dbError) throw dbError;

      // 3. Enregistrement de la transaction dans Supabase
      await supabase.from('transactions').insert([
        {
          card_id: card.id,
          type: 'TOPUP',
          amount: numericAmount,
          operator: operator,
          phone: phone,
          status: 'SUCCESS',
          created_at: new Date().toISOString(),
        },
      ]);

      onSuccess(data.card.balance);
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Recharger la carte</h2>
        <p className="text-sm text-slate-400 mb-6">
          Carte terminée par <span className="text-white font-semibold">**** {card.last4 || card.card_number?.slice(-4)}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleTopUp} className="space-y-4">
          {/* Sélection de l'opérateur */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Moyen de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {['Orange Money', 'Moov Money', 'Wave'].map((op) => (
                <button
                  type="button"
                  key={op}
                  onClick={() => setOperator(op)}
                  className={`p-2 text-xs font-semibold rounded-xl border transition-all ${
                    operator === op
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Numéro {operator}</label>
            <input
              type="tel"
              placeholder="ex: 70000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant à recharger (FCFA)</label>
            <input
              type="number"
              placeholder="ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="500"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-slate-700 rounded-xl text-slate-300 text-sm hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl text-slate-950 text-sm transition-all"
            >
              {loading ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}