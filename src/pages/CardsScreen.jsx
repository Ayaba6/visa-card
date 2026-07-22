import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, ChevronRight, Loader2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

export default function CardsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('TOUS');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('virtual_cards')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;
          setCards(data || []);
        }
      } catch (err) {
        console.error("Erreur récupération cartes:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, []);

  const filters = ['TOUS', 'VISA', 'MASTERCARD', 'GOLD'];

  const filteredCards = filter === 'TOUS' 
    ? cards 
    : cards.filter(c => c.card_type?.toUpperCase() === filter);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-0 sm:py-6 sm:px-4">
      {/* Conteneur principal Responsive */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:h-[840px] bg-slate-50 flex flex-col relative sm:rounded-3xl sm:shadow-2xl overflow-hidden border-x border-slate-200 sm:border">
        
        {/* En-tête Vert Émeraude */}
        <header className="bg-emerald-950 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-100" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-wide">Mes Cartes</h1>
          </div>
          <span className="text-[10px] bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            {cards.length} {cards.length > 1 ? 'cartes' : 'carte'}
          </span>
        </header>

        {/* Corps de page défilant */}
        <main className="p-4 flex-1 space-y-4 overflow-y-auto pb-24">
          
          {/* Bouton Créer une carte */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-emerald-100/80">
            <button 
              onClick={() => navigate('/create-card')}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-medium text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Créer une carte virtuelle</span>
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Filtres */}
          <div className="bg-slate-200/60 p-1 rounded-full flex gap-1 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 min-w-[70px] py-1.5 text-[11px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Liste des cartes */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <CreditCard className="w-7 h-7" />
              </div>
              <p className="text-xs font-medium text-slate-500">
                Aucune carte {filter !== 'TOUS' ? filter : ''} disponible.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => navigate('/card-detail', { state: { card } })}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50/30 active:scale-[0.99] transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 sm:w-14 sm:h-9 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-lg p-1.5 flex flex-col justify-between text-[7px] text-white font-mono shadow-sm border border-emerald-600/30 shrink-0">
                      <span className="font-bold tracking-wider">{card.card_type || 'VISA'}</span>
                      <span className="self-end tracking-widest">{card.card_number ? card.card_number.slice(-4) : '••••'}</span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {card.card_name || 'Carte Virtuelle'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono tracking-wide">
                        {card.card_number ? `${card.card_number.slice(0, 4)} •••• ${card.card_number.slice(-4)}` : '•••• •••• •••• ••••'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

        </main>

        <BottomNav />
      </div>
    </div>
  );
}