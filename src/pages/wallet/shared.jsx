import { Check } from 'lucide-react';
import { PageHeader } from '../../components/ui';

const OPERATORS = [
  { name: 'Orange Money', short: 'OM', cls: 'bg-orange-500 text-white' },
  { name: 'Moov Money', short: 'MM', cls: 'bg-blue-600 text-white' },
  { name: 'Wave', short: 'W', cls: 'bg-sky-400 text-white' },
];

export function OperatorPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPERATORS.map((op) => {
        const active = value === op.name;
        return (
          <button
            key={op.name}
            type="button"
            onClick={() => onChange(op.name)}
            className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition ${
              active ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold ${op.cls}`}>
              {op.short}
            </span>
            <span className="text-[11px] font-semibold text-slate-700">{op.name}</span>
            {active && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Grand champ de montant centré. */
export function AmountInput({ value, onChange, currency = 'FCFA', autoFocus, decimals = false }) {
  return (
    <div className="flex items-baseline justify-center gap-2 py-2">
      {currency === 'USD' && <span className="text-3xl font-bold text-slate-400">$</span>}
      <input
        inputMode={decimals ? 'decimal' : 'numeric'}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(',', '.');
          const clean = decimals ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') : raw.replace(/\D/g, '');
          onChange(clean.slice(0, 10));
        }}
        placeholder="0"
        className="w-full max-w-[240px] text-center text-[42px] font-extrabold tabular-nums text-slate-900 outline-none bg-transparent placeholder:text-slate-200"
      />
      {currency !== 'USD' && <span className="text-lg font-bold text-slate-400">{currency}</span>}
    </div>
  );
}

/** Page de formulaire avec bouton fixé en bas. */
export function FormPage({ title, children, footer }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      {footer && <div className="shrink-0 px-5 pt-3 pb-5 bg-slate-50 border-t border-slate-100">{footer}</div>}
    </>
  );
}

export function Section({ title, children, className = '' }) {
  return (
    <section className={`mt-5 ${className}`}>
      {title && <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h2>}
      {children}
    </section>
  );
}
