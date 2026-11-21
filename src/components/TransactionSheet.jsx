import { Copy } from 'lucide-react';
import Sheet from './Sheet';
import { describeTx } from '../lib/transactions';
import { fcfa, usd, fullDate } from '../lib/format';
import { useToast } from '../context/Overlays';

const STATUS = {
  SUCCESS: { label: 'Réussi', cls: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  FAILED: { label: 'Échoué', cls: 'bg-rose-50 text-rose-600' },
};

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 text-right break-all">{children}</span>
    </div>
  );
}

export default function TransactionSheet({ tx, onClose, context = 'wallet' }) {
  const toast = useToast();
  if (!tx) return null;
  const d = describeTx(tx, context);
  const Icon = d.icon;
  const status = STATUS[tx.status] || STATUS.SUCCESS;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(tx.reference);
      toast.success('Référence copiée');
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <Sheet open onClose={onClose} title="Détail de l'opération">
      <div className="flex flex-col items-center text-center pb-4">
        <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
          <Icon className="w-7 h-7" />
        </span>
        <p className="text-sm text-slate-500">{d.title}</p>
        <p className={`text-3xl font-extrabold tabular-nums mt-1 ${d.failed ? 'text-rose-500' : 'text-slate-900'}`}>
          {d.sign}
          {d.amount}
        </p>
        <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${status.cls}`}>{status.label}</span>
      </div>

      <div className="bg-slate-50 rounded-2xl px-4">
        <Row label="Type">{d.label}</Row>
        {tx.description && <Row label="Description">{tx.description}</Row>}
        {tx.counterparty_name && <Row label={tx.direction === 'CREDIT' ? 'Expéditeur' : 'Bénéficiaire'}>{tx.counterparty_name}</Row>}
        {tx.operator && <Row label="Opérateur">{tx.operator}</Row>}
        {tx.phone && <Row label="Téléphone">{tx.phone}</Row>}
        {Number(tx.amount_fcfa) > 0 && <Row label="Montant">{fcfa(tx.amount_fcfa)}</Row>}
        {tx.amount_usd != null && Number(tx.amount_usd) > 0 && <Row label="Montant carte">{usd(tx.amount_usd)}</Row>}
        {Number(tx.fee_fcfa) > 0 && <Row label="Frais">{fcfa(tx.fee_fcfa)}</Row>}
        <Row label="Date">{fullDate(tx.created_at)}</Row>
        <Row label="Référence">
          <button onClick={copyRef} className="inline-flex items-center gap-1.5 hover:text-emerald-700">
            {tx.reference} <Copy className="w-3.5 h-3.5" />
          </button>
        </Row>
      </div>
    </Sheet>
  );
}
