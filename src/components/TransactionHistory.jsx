import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function TransactionHistory({ cardId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cardId) {
      fetchTransactions();
    }
  }, [cardId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erreur chargement transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-white">Historique des transactions</h3>
        <button
          onClick={fetchTransactions}
          className="text-xs text-emerald-400 hover:underline"
        >
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-slate-500 text-sm">Chargement...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Aucune transaction pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-800"
            >
              <div className="flex items-center gap-3">
                {/* Icône selon le type */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.type === 'TOPUP'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {tx.type === 'TOPUP' ? '↓' : '↑'}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {tx.type === 'TOPUP' ? `Rechargement ${tx.operator || ''}` : 'Paiement carte'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.phone ? `Tél: ${tx.phone} • ` : ''}
                    {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    tx.type === 'TOPUP' ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {tx.type === 'TOPUP' ? '+' : '-'}{tx.amount?.toLocaleString()} FCFA
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  {tx.status || 'Réussi'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}