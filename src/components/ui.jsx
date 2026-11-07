import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function Spinner({ className = 'w-6 h-6' }) {
  return <Loader2 className={`animate-spin text-emerald-600 ${className}`} />;
}

export function FullScreenLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

const VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  soft: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  outline: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-emerald-700 hover:bg-emerald-50',
};

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`h-12 px-5 rounded-2xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

export function Field({ label, hint, error, icon: Icon, right, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>}
      <span
        className={`flex items-center gap-2 h-12 px-3.5 rounded-2xl bg-white border transition focus-within:ring-4 ${
          error
            ? 'border-rose-300 focus-within:ring-rose-100'
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-100'
        }`}
      >
        {Icon && <Icon className="text-slate-400 shrink-0" size={18} />}
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-slate-900 placeholder:text-slate-300"
          {...props}
        />
        {right}
      </span>
      {error ? (
        <span className="block text-xs text-rose-600 mt-1.5">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-slate-400 mt-1.5">{hint}</span>
      ) : null}
    </label>
  );
}

export function PageHeader({ title, back = true, onBack, right, dark = false }) {
  const navigate = useNavigate();
  return (
    <header
      className={`shrink-0 h-14 px-2 flex items-center gap-1 ${
        dark ? 'bg-emerald-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {back ? (
        <button
          onClick={onBack || (() => navigate(-1))}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            dark ? 'hover:bg-white/10' : 'hover:bg-slate-200/60'
          }`}
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : (
        <span className="w-3" />
      )}
      <h1 className="flex-1 text-[17px] font-bold truncate">{title}</h1>
      {right}
    </header>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1 max-w-[260px]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`h-9 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition ${
            value === o.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SummaryRow({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-4 text-sm ${strong ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  );
}

export function Notice({ tone = 'info', children }) {
  const tones = {
    info: 'bg-sky-50 text-sky-800 border-sky-100',
    warning: 'bg-amber-50 text-amber-800 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return <div className={`text-xs leading-relaxed rounded-2xl border px-3.5 py-3 ${tones[tone]}`}>{children}</div>;
}

export function AmountChips({ amounts, onPick, format }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {amounts.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onPick(a)}
          className="h-8 px-3 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
        >
          {format ? format(a) : a.toLocaleString('fr-FR')}
        </button>
      ))}
    </div>
  );
}
