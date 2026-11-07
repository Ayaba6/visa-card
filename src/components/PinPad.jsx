import { useEffect, useState } from 'react';
import { Delete, Loader2 } from 'lucide-react';

/**
 * Saisie d'un code PIN à 4 chiffres avec clavier numérique.
 * Appelle onComplete(pin) quand les 4 chiffres sont saisis.
 * Changer `resetKey` vide la saisie (ex. après une erreur).
 */
export default function PinPad({ onComplete, loading, error, resetKey, length = 4, dark = false }) {
  const [pin, setPin] = useState('');

  // Vide la saisie quand le parent le demande (resetKey change)
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setPin('');
  }

  const press = (d) => {
    if (loading || pin.length >= length) return;
    const next = pin + d;
    setPin(next);
    if (next.length === length) onComplete(next);
  };
  const erase = () => !loading && setPin((p) => p.slice(0, -1));

  // Clavier physique
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const keyClass = dark
    ? 'text-white hover:bg-white/10 active:bg-white/20'
    : 'text-slate-900 hover:bg-slate-100 active:bg-slate-200';

  return (
    <div className="flex flex-col items-center">
      <div className={`flex gap-4 h-6 items-center ${error ? 'animate-shake' : ''}`} key={error || 'ok'}>
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < pin.length
                ? error
                  ? 'bg-rose-500'
                  : dark
                    ? 'bg-emerald-400 scale-110'
                    : 'bg-emerald-600 scale-110'
                : dark
                  ? 'bg-white/20'
                  : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="h-10 flex items-center justify-center px-4 text-center">
        {loading ? (
          <Loader2 className={`w-5 h-5 animate-spin ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} />
        ) : error ? (
          <p className={`text-xs font-medium ${dark ? 'text-rose-300' : 'text-rose-600'}`}>{error}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className={`w-[72px] h-[clamp(44px,7.5dvh,60px)] rounded-2xl text-2xl font-semibold transition ${keyClass}`}
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => press('0')}
          className={`w-[72px] h-[clamp(44px,7.5dvh,60px)] rounded-2xl text-2xl font-semibold transition ${keyClass}`}
        >
          0
        </button>
        <button
          type="button"
          onClick={erase}
          aria-label="Effacer"
          className={`w-[72px] h-[clamp(44px,7.5dvh,60px)] rounded-2xl flex items-center justify-center transition ${keyClass}`}
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
