import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { api } from '../lib/api';
import { useLoad } from '../lib/useLoad';
import { dayLabel } from '../lib/format';
import { filterTx, TX_FILTERS } from '../lib/transactions';
import TransactionItem from '../components/TransactionItem';
import TransactionSheet from '../components/TransactionSheet';
import { Button, Chips, EmptyState, PageHeader, Spinner } from '../components/ui';

const PAGE = 40;

export default function Transactions() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [more, setMore] = useState({ loading: false, done: false });
  const list = useLoad(() => api.transactions({ limit: PAGE }), []);

  const loadMore = async () => {
    const items = list.data || [];
    if (!items.length) return;
    setMore({ loading: true, done: false });
    try {
      const next = await api.transactions({ limit: PAGE, before: items[items.length - 1].created_at });
      list.setData([...items, ...next]);
      setMore({ loading: false, done: next.length < PAGE });
    } catch {
      setMore({ loading: false, done: false });
    }
  };

  const groups = useMemo(() => {
    const out = [];
    for (const tx of filterTx(list.data || [], filter)) {
      const label = dayLabel(tx.created_at);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(tx);
      else out.push({ label, items: [tx] });
    }
    return out;
  }, [list.data, filter]);

  const canLoadMore = !more.done && (list.data?.length || 0) >= PAGE;

  return (
    <>
      <PageHeader title="Historique" back={false} />
      <div className="px-5 pb-3">
        <Chips options={TX_FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {list.loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !groups.length ? (
          <EmptyState icon={Receipt} title="Aucune opération" text="Vos dépôts, retraits, transferts et achats apparaîtront ici." />
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.label} className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 first-letter:uppercase">{g.label}</h2>
                <div className="bg-white rounded-3xl border border-slate-100 px-4 py-1">
                  {g.items.map((t) => (
                    <TransactionItem key={t.id} tx={t} onClick={() => setSelected(t)} />
                  ))}
                </div>
              </section>
            ))}
            {canLoadMore && (
              <Button variant="outline" className="w-full" loading={more.loading} onClick={loadMore}>
                Charger plus
              </Button>
            )}
          </>
        )}
      </div>
      <TransactionSheet tx={selected} onClose={() => setSelected(null)} />
    </>
  );
}
