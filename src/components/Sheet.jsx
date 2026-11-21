import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/** Panneau qui monte du bas de l'écran (dans le cadre de l'app). Fermeture par Échap ou clic sur le fond. */
export default function Sheet({ open, onClose, title, children, dismissable = true }) {
  const titleId = useId();
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Fenêtre'}
        className="relative bg-white rounded-t-[28px] max-h-[92%] flex flex-col animate-slide-up shadow-2xl"
      >
        <div className="pt-2.5 flex justify-center" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        {(title || dismissable) && (
          <div className="flex items-center justify-between px-5 pt-2 pb-1">
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {dismissable && (
              <button
                onClick={onClose}
                className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
