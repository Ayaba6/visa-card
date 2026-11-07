import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  Snowflake,
  Sun,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Trash2,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { fcfa, groupPan, usd } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { usePinPrompt, useToast } from '../../context/Overlays';
import CardVisual from '../../components/CardVisual';
import Sheet from '../../components/Sheet';
import TransactionItem from '../../components/TransactionItem';
import TransactionSheet from '../../components/TransactionSheet';
import { AmountChips, Button, EmptyState, Field, FullScreenLoader, Notice, PageHeader, SummaryRow } from '../../components/ui';
import { AmountInput } from '../wallet/shared';

const REVEAL_SECONDS = 60;

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const { refreshProfile, settings } = useAuth();

  const card = useLoad(() => api.card(id), [id]);
  const txs = useLoad(() => api.transactions({ cardId: id, limit: 50 }), [id]);

  const [secret, setSecret] = useState(null);
  const [sheet, setSheet] = useState(null); // 'fund' | 'unload' | 'more' | 'simulate'
  const [selectedTx, setSelectedTx] = useState(null);
  const [busy, setBusy] = useState(false);

  // Masque automatiquement les détails après 60 s
  useEffect(() => {
    if (!secret) return;
    const t = setTimeout(() => setSecret(null), REVEAL_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [secret]);

  const refresh = async () => {
    await Promise.all([card.reload(), txs.reload(), refreshProfile()]);
  };

  if (card.loading) return <FullScreenLoader />;
  const c = card.data;
  if (!c || c.status === 'TERMINATED') {
    return (
      <>
        <PageHeader title="Carte" />
        <EmptyState icon={Receipt} title="Carte introuvable" text="Elle a peut-être été supprimée." />
      </>
    );
  }

  const frozen = c.status === 'FROZEN';

  const reveal = async () => {
    if (secret) return setSecret(null);
    const res = await confirmWithPin({
      title: 'Afficher les détails',
      subtitle: 'Numéro complet, date et CVV',
      action: (pin) => api.revealCard(c.id, pin),
    });
    if (res.ok) setSecret(res.result);
    else if (res.error) toast.error(res.error);
  };

  const toggleFreeze = async () => {
    if (!frozen) {
      setBusy(true);
      try {
        await api.setCardFrozen(c.id, true);
        toast.info('Carte gelée : les paiements sont bloqués');
        await refresh();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const res = await confirmWithPin({
      title: 'Dégeler la carte',
      action: (pin) => api.setCardFrozen(c.id, false, pin),
    });
    if (res.ok) {
      toast.success('Carte réactivée');
      await refresh();
    } else if (res.error) toast.error(res.error);
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copié`);
    } catch {
      toast.error('Copie impossible');
    }
  };

  const terminate = async () => {
    setSheet(null);
    const res = await confirmWithPin({
      title: 'Supprimer définitivement la carte ?',
      subtitle: `Le solde (${usd(c.balance_usd)}) sera remboursé sur votre compte.`,
      action: (pin) => api.terminateCard(c.id, pin),
    });
    if (res.ok) {
      await refreshProfile();
      toast.success(`Carte supprimée · ${fcfa(res.result.refund_fcfa)} remboursés`);
      navigate('/cards', { replace: true });
    } else if (res.error) toast.error(res.error);
  };

  const actions = [
    { label: 'Recharger', icon: Plus, onClick: () => setSheet('fund'), disabled: frozen },
    { label: 'Retirer', icon: ArrowUpRight, onClick: () => setSheet('unload'), disabled: frozen },
    { label: frozen ? 'Dégeler' : 'Geler', icon: frozen ? Sun : Snowflake, onClick: toggleFreeze, disabled: busy },
    { label: 'Plus', icon: MoreHorizontal, onClick: () => setSheet('more') },
  ];

  return (
    <>
      <PageHeader title={c.label} onBack={() => navigate('/cards')} />
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <CardVisual card={c} secret={secret} />

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-slate-500">Solde de la carte</p>
            <p className="text-2xl font-extrabold tabular-nums">{usd(c.balance_usd)}</p>
          </div>
          <button
            onClick={reveal}
            className="h-10 px-4 rounded-full bg-white border border-slate-200 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            {secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {secret ? 'Masquer' : 'Afficher les détails'}
          </button>
        </div>

        {secret && (
          <div className="mt-4 bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100">
            {[
              ['Numéro de carte', groupPan(secret.pan), secret.pan],
              ["Date d'expiration", secret.expiry, secret.expiry],
              ['CVV', secret.cvv, secret.cvv],
              ['Titulaire', c.holder_name, c.holder_name],
            ].map(([label, shown, raw]) => (
              <button
                key={label}
                onClick={() => copy(raw, label)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-3xl last:rounded-b-3xl"
              >
                <span>
                  <span className="block text-xs text-slate-400">{label}</span>
                  <span className="block font-mono font-semibold text-slate-900">{shown}</span>
                </span>
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
            ))}
            <p className="px-4 py-2.5 text-[11px] text-slate-400">
              Masqué automatiquement après {REVEAL_SECONDS} secondes. Ne partagez jamais ces informations.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mt-5">
          {actions.map(({ label, icon: Icon, onClick, disabled }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </button>
          ))}
        </div>

        {frozen && (
          <div className="mt-4">
            <Notice tone="info">Carte gelée : tous les paiements sont refusés tant que vous ne la dégelez pas.</Notice>
          </div>
        )}

        <h2 className="font-bold text-slate-900 mt-7 mb-1">Transactions de la carte</h2>
        <div className="bg-white rounded-3xl border border-slate-100 px-4 py-1">
          {txs.data?.length ? (
            txs.data.map((t) => (
              <TransactionItem key={t.id} tx={t} context="card" showDate onClick={() => setSelectedTx(t)} />
            ))
          ) : (
            <EmptyState icon={Receipt} title="Aucune transaction" text="Vos achats avec cette carte apparaîtront ici." />
          )}
        </div>
      </div>

      <FundSheet open={sheet === 'fund'} card={c} settings={settings} onClose={() => setSheet(null)} onDone={refresh} />
      <UnloadSheet open={sheet === 'unload'} card={c} settings={settings} onClose={() => setSheet(null)} onDone={refresh} />
      <SimulateSheet open={sheet === 'simulate'} card={c} onClose={() => setSheet(null)} onDone={refresh} />

      <Sheet open={sheet === 'more'} onClose={() => setSheet(null)} title="Options de la carte">
        <div className="space-y-2">
          {settings?.simulation_mode && (
            <MenuButton icon={ShoppingBag} onClick={() => setSheet('simulate')} text="Simuler un achat en ligne" sub="Mode démo : teste un paiement" />
          )}
          <MenuButton icon={Copy} onClick={() => { setSheet(null); reveal(); }} text="Copier les détails de la carte" sub="Pour payer sur un site marchand" />
          <MenuButton icon={Trash2} danger onClick={terminate} text="Supprimer la carte" sub="Le solde restant est remboursé" />
        </div>
      </Sheet>

      <TransactionSheet tx={selectedTx} context="card" onClose={() => setSelectedTx(null)} />
    </>
  );
}

function MenuButton({ icon: Icon, text, sub, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span>
        <span className={`block text-sm font-semibold ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{text}</span>
        <span className="block text-xs text-slate-400">{sub}</span>
      </span>
    </button>
  );
}

function FundSheet({ open, card, settings, onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const value = Number(amount) || 0;
  const rate = Number(settings?.usd_rate_fcfa ?? 650);
  const feePct = Number(settings?.card_fund_fee_percent ?? 2);
  const min = Number(settings?.card_min_fund_fcfa ?? 1000);
  const fee = Math.ceil((value * feePct) / 100);
  const usdValue = Math.round((value / rate) * 100) / 100;
  const balance = Number(profile?.balance_fcfa || 0);
  const insufficient = value + fee > balance;

  const submit = async () => {
    setError('');
    const res = await confirmWithPin({
      title: `Recharger ${usd(usdValue)}`,
      subtitle: `${fcfa(value + fee)} débités de votre solde`,
      action: (pin) => api.fundCard(card.id, value, pin),
    });
    if (res.ok) {
      toast.success(`+${usd(res.result.amount_usd)} sur votre carte`);
      setAmount('');
      onClose();
      onDone();
    } else if (res.error) setError(res.error);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Recharger la carte">
      <AmountInput value={amount} onChange={setAmount} autoFocus />
      <p className="text-center text-sm font-semibold text-emerald-700 -mt-1 mb-3">≈ {usd(usdValue)}</p>
      <AmountChips amounts={[2000, 5000, 10000, 25000]} onPick={(a) => setAmount(String(a))} />
      <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mt-4">
        <SummaryRow label="Taux" value={`1 USD = ${rate} FCFA`} />
        <SummaryRow label={`Frais (${feePct} %)`} value={fcfa(fee)} />
        <SummaryRow label="Total débité" value={fcfa(value + fee)} strong />
      </div>
      <p className={`text-xs mt-2 ${insufficient && value ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
        {insufficient && value ? 'Solde insuffisant' : `Solde disponible : ${fcfa(balance)} · minimum ${fcfa(min)}`}
      </p>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      <Button className="w-full mt-4" disabled={value < min || insufficient} onClick={submit}>
        Recharger
      </Button>
    </Sheet>
  );
}

function UnloadSheet({ open, card, settings, onClose, onDone }) {
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const value = Number(amount) || 0;
  const rate = Number(settings?.usd_sell_rate_fcfa ?? 600);
  const max = Number(card.balance_usd);
  const fcfaValue = Math.floor(value * rate);
  const tooMuch = value > max;

  const submit = async () => {
    setError('');
    const res = await confirmWithPin({
      title: `Retirer ${usd(value)}`,
      subtitle: `${fcfa(fcfaValue)} crédités sur votre solde`,
      action: (pin) => api.unloadCard(card.id, value, pin),
    });
    if (res.ok) {
      toast.success(`${fcfa(res.result.amount_fcfa)} crédités sur votre solde`);
      setAmount('');
      onClose();
      onDone();
    } else if (res.error) setError(res.error);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Retirer vers mon solde">
      <AmountInput value={amount} onChange={setAmount} currency="USD" decimals autoFocus />
      <div className="flex justify-between text-xs mb-3">
        <span className={tooMuch ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
          {tooMuch ? 'Montant supérieur au solde' : `Disponible : ${usd(max)}`}
        </span>
        <button className="font-bold text-emerald-700" onClick={() => setAmount(String(max))}>
          Tout retirer
        </button>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
        <SummaryRow label="Taux de reprise" value={`1 USD = ${rate} FCFA`} />
        <SummaryRow label="Vous recevez" value={fcfa(fcfaValue)} strong />
      </div>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      <Button className="w-full mt-4" disabled={value < 1 || tooMuch} onClick={submit}>
        Retirer
      </Button>
    </Sheet>
  );
}

const MERCHANTS = ['Netflix', 'Amazon', 'AliExpress', 'Spotify', 'Google Play', 'Canva'];

function SimulateSheet({ open, card, onClose, onDone }) {
  const toast = useToast();
  const [merchant, setMerchant] = useState('Netflix');
  const [amount, setAmount] = useState('9.99');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.simulatePayment(card.id, merchant, Number(amount));
      toast.success(`Paiement de ${usd(amount)} chez ${merchant} accepté`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      onDone();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Simuler un achat">
      <Notice tone="warning">Mode démo : aucun vrai paiement n'est effectué.</Notice>
      <div className="flex flex-wrap gap-2 mt-4">
        {MERCHANTS.map((m) => (
          <button
            key={m}
            onClick={() => setMerchant(m)}
            className={`h-9 px-3 rounded-full text-sm font-semibold ${
              merchant === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <Field className="mt-4" label="Montant (USD)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} />
      <Button className="w-full mt-4" loading={loading} disabled={!(Number(amount) > 0)} onClick={submit}>
        Payer {usd(amount)}
      </Button>
    </Sheet>
  );
}
