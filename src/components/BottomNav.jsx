import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Bell, Settings } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Accueil', icon: Home, path: '/dashboard' },
    { label: 'Cartes', icon: CreditCard, path: '/cards' },
    { label: 'Alertes', icon: Bell, path: '/notifications' },
    { label: 'Réglages', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center z-10">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 text-xs transition-colors ${
              isActive ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}