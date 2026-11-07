import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Eye, EyeOff, Download, ArrowUpRight, Send, CreditCard, Plus, ChevronRight, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useLoad, useLocalPref } from '../lib/useLoad';
import { fcfa, firstName, initials, usd } from '../lib/format';
import CardVisual from '../components/CardVisual';
import TransactionItem from '../components/TransactionItem';
import TransactionSheet from '../components/TransactionSheet';
import { EmptyState, Spinner } from '../components/ui';

const ACTIONS = [
  { to: '/deposit', label: 'Déposer', icon: Download },
  { to: '/withdraw', label: 'Retirer', icon: ArrowUpRight },
  { to: '/transfer', label: 'Envoyer', icon: Send },
  { to: '/cards/new', label: 'Nouvelle carte', icon: Plus },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function Home() {
  const navigate = useNavigate();
  const { profile, settings, refreshProfile } = useAuth();
  const [hidden, setHidden] = useLocalPref('kp_hide_balance', false);
  const [selectedTx, setSelectedTx] = useState(null);

  const cards = useLoad(() => api.cards(), []);
  const txs = useLoad(() => api.transactions({ limit: 6 }), []);
  const unread = useLoad(() => api.unreadCount(), []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const totalCardsUsd = (cards.data || []).reduce((s, c) => s + Number(c.balance_usd), 0);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* En-tête + solde */}
      <section className="bg-emerald-950 text-white px-5 pt-4 pb-20 rounded-b-[32px] relative overflow-hidden">
        <span className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <Link to="/settings" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-400 text-emerald-950 font-extrabold flex items-center justify-center">
              {initials(profile?.full_name)}
            </span>
            <span>
              <span className="block text-xs text-emerald-200/70">{greeting()},</span>
              <span className="block font-bold leading-tight">{firstName(profile?.full_name) || 'Bienvenue'}</span>
            </span>
          </Link>
          <Link
            to="/notifications"
            className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread.data > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center">
                {unread.data > 9 ? '9+' : unread.data}
              </span>
            )}
          </Link>
        </div>

        <div className="relative mt-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/70">Solde disponible</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[34px] font-extrabold tabular-nums tracking-tight">
              {hidden ? '••••••' : fcfa(profile?.balance_fcfa)}
            </p>
            <button
              onClick={() => setHidden(!hidden)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-200"
              aria-label={hidden ? 'Afficher le solde' : 'Masquer le solde'}
            >
              {hidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          {(cards.data?.length || 0) > 0 && (
            <p className="text-sm text-emerald-200/70 mt-1">
              + {hidden ? '••••' : usd(totalCardsUsd)} sur {cards.data.length} carte{cards.data.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>

      {/* Actions rapides */}
      <section className="px-5 -mt-12 relative">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-900/5 border border-slate-100 p-3 grid grid-cols-4">
          {ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2 py-2 rounded-2xl hover:bg-slate-50">
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {(!profile?.full_name || !profile?.phone) && (
        <Link
          to="/profile"
          className="mx-5 mt-4 flex items-center justify-between gap-3 text-sm bg-white border border-emerald-100 rounded-2xl px-4 py-3"
        >
          <span>
            <span className="block font-semibold text-slate-900">Complétez votre profil</span>
            <span className="block text-xs text-slate-500">
              Ajoutez votre nom et votre numéro pour recevoir des transferts.
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
        </Link>
      )}

      {settings?.simulation_mode && (
        <p className="mx-5 mt-4 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Mode démo : les dépôts Mobile Money et paiements par carte sont simulés.
        </p>
      )}

      {/* Cartes */}
      <section className="mt-6">
        <div className="px-5 flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Mes cartes</h2>
          <Link to="/cards" className="text-sm font-semibold text-emerald-700 flex items-center">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {cards.loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : cards.data?.length ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 snap-x snap-mandatory pb-1">
            {cards.data.map((c) => (
              <div key={c.id} className="w-[78%] shrink-0 snap-center">
                <CardVisual card={c} showBalance={!hidden} onClick={() => navigate(`/cards/${c.id}`)} />
              </div>
            ))}
            <button
              onClick={() => navigate('/cards/new')}
              className="w-[38%] shrink-0 snap-center rounded-[22px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-semibold">Ajouter</span>
            </button>
          </div>
        ) : (
          <div className="mx-5">
            <button
              onClick={() => navigate('/cards/new')}
              className="w-full rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 text-left flex items-center gap-4 shadow-lg shadow-emerald-600/20"
            >
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold">Créez votre carte virtuelle</span>
                <span className="block text-sm text-emerald-50/80">
                  Visa ou Mastercard en USD, prête en quelques secondes.
                </span>
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>

      {/* Transactions récentes */}
      <section className="mt-6 px-5 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-slate-900">Activité récente</h2>
          <Link to="/transactions" className="text-sm font-semibold text-emerald-700 flex items-center">
            Tout voir <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 px-4 py-1">
          {txs.loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : txs.data?.length ? (
            txs.data.map((t) => <TransactionItem key={t.id} tx={t} showDate onClick={() => setSelectedTx(t)} />)
          ) : (
            <EmptyState icon={Receipt} title="Aucune opération" text="Faites votre premier dépôt pour commencer." />
          )}
        </div>
      </section>

      <TransactionSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
