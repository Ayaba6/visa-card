import { useEffect } from 'react';
import { BellOff, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useLoad } from '../lib/useLoad';
import { shortDate, time } from '../lib/format';
import { EmptyState, PageHeader, Spinner } from '../components/ui';

const KINDS = {
  SUCCESS: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
  WARNING: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600' },
  INFO: { icon: Info, cls: 'bg-sky-50 text-sky-600' },
};

export default function Notifications() {
  const { data, loading } = useLoad(() => api.notifications(), []);

  // Marque tout comme lu à l'ouverture (l'affichage garde l'état « non lu » de ce passage)
  useEffect(() => {
    api.markNotificationsRead().catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Notifications" />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !data?.length ? (
          <EmptyState icon={BellOff} title="Rien de nouveau" text="Vos alertes de compte et de cartes apparaîtront ici." />
        ) : (
          <div className="space-y-2">
            {data.map((n) => {
              const k = KINDS[n.kind] || KINDS.INFO;
              const Icon = k.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 rounded-3xl border ${n.read ? 'bg-white border-slate-100' : 'bg-emerald-50/40 border-emerald-100'}`}
                >
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${k.cls}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {shortDate(n.created_at)} · {time(n.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
