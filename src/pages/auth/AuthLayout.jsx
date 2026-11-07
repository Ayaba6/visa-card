import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Logo({ light = false, size = 'text-2xl' }) {
  return (
    <span className={`font-extrabold tracking-tight ${size} ${light ? 'text-white' : 'text-emerald-950'}`}>
      koda<span className={light ? 'text-emerald-300' : 'text-emerald-500'}>pay</span>
    </span>
  );
}

/** Mise en page commune aux écrans de connexion / inscription. */
export default function AuthLayout({ title, subtitle, children, footer, back = true }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="min-h-full flex flex-col px-6 pb-8">
        <div className="h-14 flex items-center -mx-2">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <Logo />
        <h1 className="text-[26px] font-extrabold text-slate-900 mt-6 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
        <div className="mt-7 flex-1">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}
