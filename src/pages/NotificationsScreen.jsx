import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            setNotifications(data);
          }
        }
      } catch (err) {
        console.error("Erreur chargement notifications:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-20">
      {/* En-tête Vert Émeraude Profond */}
      <div className="bg-emerald-950 text-white p-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-emerald-100" />
        </button>
        <h1 className="text-lg font-semibold tracking-wide">Notifications</h1>
      </div>

      <div className="p-4 flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          </div>
        ) : notifications.length === 0 ? (
          /* Message affiché quand il n'y a aucune notification */
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <BellOff className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-500">
              Aucune notification pour le moment.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isWarning = notif.status === 'warning' || notif.type === 'AVERTISSEMENT';

            return (
              <div 
                key={notif.id} 
                className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-2 hover:border-emerald-200 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    isWarning 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {notif.type || 'SUCCESS'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Récemment'}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  {isWarning ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}