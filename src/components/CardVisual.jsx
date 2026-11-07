import { Snowflake } from 'lucide-react';
import { usd, groupPan } from '../lib/format';
import { CARD_THEMES } from '../lib/cardThemes';

function BrandMark({ brand }) {
  if (brand === 'MASTERCARD') {
    return (
      <span className="flex items-center" aria-label="Mastercard">
        <span className="w-7 h-7 rounded-full bg-rose-500/90" />
        <span className="w-7 h-7 rounded-full bg-amber-400/90 -ml-3 mix-blend-screen" />
      </span>
    );
  }
  return <span className="text-2xl font-black italic tracking-tight">VISA</span>;
}

function Chip() {
  return (
    <span className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 relative overflow-hidden shadow-inner">
      <span className="absolute inset-x-0 top-1/2 h-px bg-amber-700/30" />
      <span className="absolute inset-y-0 left-1/3 w-px bg-amber-700/30" />
      <span className="absolute inset-y-0 right-1/3 w-px bg-amber-700/30" />
    </span>
  );
}

/**
 * Visuel d'une carte virtuelle.
 * `secret` = { pan, cvv, expiry } quand l'utilisateur a révélé les détails.
 */
export default function CardVisual({ card, secret, compact = false, showBalance = true, onClick }) {
  const theme = CARD_THEMES[card.color] || CARD_THEMES.emerald;
  const frozen = card.status === 'FROZEN';
  const expiry =
    secret?.expiry ||
    (card.expiry_month ? `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}` : '••/••');

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-[1.586] rounded-[22px] p-5 text-white overflow-hidden shadow-xl bg-gradient-to-br ${theme.bg} ${
        onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''
      } ${compact ? 'p-4' : ''}`}
    >
      {/* Décor */}
      <span className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
      <span className="absolute -left-10 -bottom-24 w-64 h-64 rounded-full bg-black/10" />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-semibold">{card.label}</p>
            {showBalance && <p className="text-2xl font-bold mt-0.5 tabular-nums">{usd(card.balance_usd)}</p>}
          </div>
          <span className="text-sm font-extrabold tracking-tight">
            koda<span className="text-white/60">pay</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Chip />
          <span className="font-mono text-[17px] tracking-[0.12em] tabular-nums">
            {secret ? groupPan(secret.pan) : `•••• •••• •••• ${card.last4}`}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex gap-5 min-w-0">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-white/60">Titulaire</p>
              <p className="text-xs font-semibold uppercase truncate">{card.holder_name}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/60">Exp</p>
              <p className="text-xs font-semibold font-mono">{expiry}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/60">CVV</p>
              <p className="text-xs font-semibold font-mono">{secret?.cvv || '•••'}</p>
            </div>
          </div>
          <BrandMark brand={card.brand} />
        </div>
      </div>

      {frozen && (
        <div className="absolute inset-0 bg-sky-100/30 backdrop-blur-[3px] flex items-center justify-center">
          <span className="flex items-center gap-2 bg-white/90 text-sky-800 text-sm font-bold px-4 py-2 rounded-full shadow">
            <Snowflake className="w-4 h-4" /> Carte gelée
          </span>
        </div>
      )}
    </div>
  );
}
