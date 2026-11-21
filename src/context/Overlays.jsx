import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { PinContext, ToastContext } from './contexts';
import { CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import Sheet from '../components/Sheet';
import PinPad from '../components/PinPad';

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((kind, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 5000 : 3200);
  }, []);

  const toast = useMemo(
    () => ({
      success: (t) => push('success', t),
      error: (t) => push('error', t),
      info: (t) => push('info', t),
    }),
    [push],
  );

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const tones = {
    success: 'bg-emerald-950 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-900 text-white',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="absolute top-3 inset-x-3 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl animate-slide-down ${tones[t.kind]}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-px" />
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);

/* ------------------------------------------------------------------ */
/* Confirmation par code PIN                                           */
/*   const ok = await confirmWithPin({ title, action: (pin) => api… }) */
/*   Le PIN est redemandé tant que l'action échoue pour "PIN".         */
/* ------------------------------------------------------------------ */

export function PinPromptProvider({ children }) {
  const [state, setState] = useState(null); // { title, subtitle }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const pending = useRef(null); // { action, resolve }

  const confirmWithPin = useCallback(({ title = 'Confirmez avec votre code PIN', subtitle, action }) => {
    return new Promise((resolve) => {
      pending.current = { action, resolve };
      setError('');
      setLoading(false);
      setResetKey((k) => k + 1);
      setState({ title, subtitle });
    });
  }, []);

  const close = (result) => {
    pending.current?.resolve(result);
    pending.current = null;
    setState(null);
  };

  const onComplete = async (pin) => {
    if (!pending.current) return;
    setLoading(true);
    setError('');
    try {
      const result = await pending.current.action(pin);
      setLoading(false);
      close({ ok: true, result });
    } catch (err) {
      setLoading(false);
      const message = err.message || 'Erreur';
      if (/PIN|tentatives/i.test(message)) {
        // Mauvais PIN : on laisse l'utilisateur réessayer
        setError(message);
        setResetKey((k) => k + 1);
      } else {
        close({ ok: false, error: message });
      }
    }
  };

  return (
    <PinContext.Provider value={confirmWithPin}>
      {children}
      <Sheet open={!!state} onClose={() => !loading && close({ ok: false, cancelled: true })} dismissable={!loading}>
        {state && (
          <div className="flex flex-col items-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900 text-center">{state.title}</p>
            {state.subtitle && <p className="text-sm text-slate-500 text-center mt-1">{state.subtitle}</p>}
            <div className="mt-5">
              <PinPad onComplete={onComplete} loading={loading} error={error} resetKey={resetKey} />
            </div>
          </div>
        )}
      </Sheet>
    </PinContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePinPrompt = () => useContext(PinContext);
