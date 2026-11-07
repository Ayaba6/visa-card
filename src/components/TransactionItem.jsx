import { describeTx } from '../lib/transactions';
import { time, shortDate } from '../lib/format';

const TONES = {
  credit: { icon: 'bg-emerald-50 text-emerald-600', amount: 'text-emerald-600' },
  debit: { icon: 'bg-slate-100 text-slate-700', amount: 'text-slate-900' },
  neutral: { icon: 'bg-slate-100 text-slate-500', amount: 'text-slate-500' },
  failed: { icon: 'bg-rose-50 text-rose-500', amount: 'text-rose-500 line-through' },
};

export default function TransactionItem({ tx, context = 'wallet', onClick, showDate = false }) {
  const d = describeTx(tx, context);
  const Icon = d.icon;
  const tone = TONES[d.tone] || TONES.neutral;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition"
    >
      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone.icon}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-900 truncate">{d.title}</span>
        <span className="block text-xs text-slate-400 truncate">
          {d.failed ? 'Échoué · ' : ''}
          {showDate ? `${shortDate(tx.created_at)} · ` : ''}
          {time(tx.created_at)}
          {tx.description && !d.failed && tx.type !== 'CARD_PAYMENT' && tx.description !== d.title
            ? ` · ${tx.description}`
            : ''}
          {d.failed && tx.description ? ` · ${tx.description.replace(/^Refusé : /, '')}` : ''}
        </span>
      </span>
      <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${tone.amount}`}>
        {d.sign}
        {d.amount}
      </span>
    </button>
  );
}
