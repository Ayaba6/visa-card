import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { useAuth } from '../../context/AuthContext';
import CardVisual from '../../components/CardVisual';
import { Button, EmptyState, PageHeader, Spinner } from '../../components/ui';

export default function Cards() {
  const navigate = useNavigate();
  const { settings } = useAuth();
  const { data: cards, loading } = useLoad(() => api.cards(), []);
  const max = settings?.max_active_cards ?? 5;
  const canCreate = (cards?.length || 0) < max;

  return (
    <>
      <PageHeader
        title="Mes cartes"
        back={false}
        right={
          canCreate && cards?.length > 0 ? (
            <button
              onClick={() => navigate('/cards/new')}
              className="h-9 px-3 mr-2 rounded-full bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Nouvelle
            </button>
          ) : null
        }
      />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !cards?.length ? (
          <EmptyState
            icon={CreditCard}
            title="Aucune carte pour le moment"
            text="Créez une carte Visa ou Mastercard virtuelle pour payer en ligne partout dans le monde."
            action={
              <Button onClick={() => navigate('/cards/new')}>
                <Plus className="w-4 h-4" /> Créer ma carte
              </Button>
            }
          />
        ) : (
          <div className="space-y-4 pt-1">
            {cards.map((c) => (
              <CardVisual key={c.id} card={c} onClick={() => navigate(`/cards/${c.id}`)} />
            ))}
            <p className="text-center text-xs text-slate-400 pt-2">
              {cards.length} / {max} cartes actives
            </p>
          </div>
        )}
      </div>
    </>
  );
}
