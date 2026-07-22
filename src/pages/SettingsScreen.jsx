import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  UserCheck, 
  Share2, 
  Diamond, 
  MessageSquare, 
  KeyRound, 
  FileText, 
  Info, 
  Star, 
  LogOut, 
  ChevronRight,
  User,
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Récupération des données utilisateur au chargement
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        setAuthUser(user);

        // Récupérer le profil correspondant
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) setProfile(data);

      } catch (err) {
        console.error("Erreur chargement paramètres:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [navigate]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error("Erreur déconnexion:", err.message);
    }
  };

  const userPhone = profile?.phone || authUser?.user_metadata?.phone || 'Non renseigné';
  const fullName = authUser?.user_metadata?.full_name || 'Utilisateur Kodapay';

  const options = [
    { label: 'Mon compte est vérifié', icon: UserCheck, color: 'text-emerald-600' },
    { 
      label: 'Inviter un ami', 
      subtitle: 'Bénéficiez de 40% sur le premier abonnement de votre invité', 
      icon: Share2, 
      color: 'text-emerald-600' 
    },
    { label: 'Premium', icon: Diamond, color: 'text-emerald-700' },
    { label: 'Contactez le service client', icon: MessageSquare, color: 'text-emerald-600' },
    { label: 'Modifier mon mot de passe', icon: KeyRound, color: 'text-emerald-800' },
    { label: "Conditions d'utilisation", icon: FileText, color: 'text-emerald-800' },
    { label: 'À propos', icon: Info, color: 'text-emerald-800' },
    { label: 'Fonctionnalités', icon: Star, color: 'text-slate-600' },
    { 
      label: `Déconnexion (${userPhone})`, 
      icon: LogOut, 
      color: 'text-red-500', 
      action: handleLogout 
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-emerald-50/30">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-20">
      {/* En-tête Vert Émeraude */}
      <div className="bg-emerald-950 text-white p-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-emerald-100" />
        </button>
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </div>

      <div className="p-4 flex-1 space-y-3 overflow-y-auto">
        {/* Carte Profil Utilisateur */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{fullName}</h2>
            <p className="text-xs text-slate-500 font-medium">{authUser?.email}</p>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">{userPhone}</p>
          </div>
        </div>

        {/* Options de paramètres */}
        <div className="space-y-2">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <div
                key={i}
                onClick={opt.action || (() => alert(`Option: ${opt.label}`))}
                className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40 active:scale-[0.99] transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                  <div>
                    <p className={`text-xs font-semibold ${opt.color === 'text-red-500' ? 'text-red-500' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    {opt.subtitle && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">{opt.subtitle}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4 pb-2 text-[10px] text-slate-400 font-medium">
          Kodapay v2.0.763 Build:95
        </div>
      </div>

      <BottomNav />
    </div>
  );
}