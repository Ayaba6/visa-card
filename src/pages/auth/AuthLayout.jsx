import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import CardVisual from '../../components/CardVisual';

/** Logo Kodapay : symbole + nom. La taille suit la classe de texte (`size`). */
export function Logo({ light = false, size = 'text-2xl', mark = true }) {
  return (
    <span className={`inline-flex items-center gap-[0.35em] font-extrabold tracking-tight leading-none ${size} ${light ? 'text-white' : 'text-emerald-950'}`}>
      {mark && <img src="/logo.svg" alt="" aria-hidden="true" className="w-[1.25em] h-[1.25em] rounded-[0.32em] shadow-sm" />}
      <span>
        koda<span className={light ? 'text-emerald-300' : 'text-emerald-500'}>pay</span>
      </span>
    </span>
  );
}

const PANEL_CARDS = [
  { label: 'Abonnements', brand: 'MASTERCARD', holder_name: 'AWA OUEDRAOGO', last4: '7730', balance_usd: 38, color: 'midnight', expiry_month: 3, expiry_year: 2029 },
  { label: 'Shopping', brand: 'VISA', holder_name: 'AWA OUEDRAOGO', last4: '4821', balance_usd: 124.5, color: 'emerald', expiry_month: 9, expiry_year: 2029 },
];

const PANEL_POINTS = [
  'Carte Visa ou Mastercard prête en 1 minute',
  'Rechargée avec Orange Money, Moov Money ou Wave',
  'Chaque opération protégée par votre code PIN',
];

/** Panneau de marque affiché à gauche sur ordinateur. */
function BrandPanel() {
  return (
    <aside className="hidden lg:flex w-[46%] max-w-[640px] shrink-0 relative overflow-hidden bg-emerald-950 text-white flex-col justify-between p-12">
      <span className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
      <span className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-emerald-400/10 blur-3xl" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="auth-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="relative">
        <Logo light size="text-3xl" />
      </div>

      <div className="relative">
        <div className="relative h-[300px] max-w-[380px]">
          <div className="absolute inset-x-10 top-0 rotate-[6deg] opacity-80">
            <CardVisual card={PANEL_CARDS[0]} />
          </div>
          <div className="absolute inset-x-0 top-14 -rotate-[3deg] shadow-2xl shadow-black/40 rounded-[22px]">
            <CardVisual card={PANEL_CARDS[1]} />
          </div>
        </div>

        <h2 className="text-[34px] font-extrabold leading-[1.1] mt-8 max-w-md">
          Payez en ligne partout, <span className="text-emerald-300">avec votre Mobile Money.</span>
        </h2>
        <ul className="mt-6 space-y-3">
          {PANEL_POINTS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-emerald-50/85">
              <span className="w-6 h-6 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center justify-between text-sm text-emerald-100/50">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Données chiffrées et protégées
        </span>
        <span>© {new Date().getFullYear()} Kodalink · Burkina Faso</span>
      </div>
    </aside>
  );
}

/** Indicateur « Étape 2 sur 3 » avec barres de progression. */
export function StepProgress({ current, total, label }) {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between text-xs font-semibold mb-2">
        <span className="text-emerald-700">
          Étape {current} sur {total}
        </span>
        {label && <span className="text-slate-400">{label}</span>}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <span
              className={`block h-full rounded-full bg-emerald-500 transition-all duration-500 ${i < current ? 'w-full' : 'w-0'}`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Mise en page commune aux écrans de connexion / inscription.
 * Mobile : plein écran dans le cadre de l'app. Ordinateur : panneau de marque à gauche, formulaire à droite.
 */
export default function AuthLayout({ title, subtitle, children, footer, back = true, onBack, step, topRight, icon: Icon }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 min-h-0 flex bg-white">
      <BrandPanel />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="min-h-full w-full max-w-[460px] mx-auto flex flex-col px-6 sm:px-8 pb-8 lg:py-10">
          <div className="h-14 shrink-0 flex items-center justify-between gap-3 -mx-2 lg:mx-0">
            <div className="flex items-center gap-1">
              {back && (
                <button
                  onClick={onBack || (() => navigate(-1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 lg:-ml-2"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <span className="lg:hidden">
                <Logo size="text-xl" />
              </span>
            </div>
            {topRight && <div className="text-sm text-slate-500">{topRight}</div>}
          </div>

          <div className="flex-1 flex flex-col lg:justify-center pt-4 lg:pt-0">
            {step && <StepProgress {...step} />}
            {Icon && (
              <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Icon className="w-7 h-7" />
              </span>
            )}
            <h1 className="text-[28px] lg:text-[32px] font-extrabold text-slate-900 leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-[15px] text-slate-500 mt-2 leading-relaxed">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
