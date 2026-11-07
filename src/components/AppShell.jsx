import { NavLink, Outlet } from 'react-router-dom';
import { Home, CreditCard, ArrowLeftRight, User } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/cards', label: 'Cartes', icon: CreditCard },
  { to: '/transactions', label: 'Historique', icon: ArrowLeftRight },
  { to: '/settings', label: 'Compte', icon: User },
];

/** Écrans principaux avec la barre de navigation en bas. */
export default function AppShell() {
  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <nav className="shrink-0 bg-white border-t border-slate-100 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`px-4 py-1 rounded-full transition ${isActive ? 'bg-emerald-50' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
