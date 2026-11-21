import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Tag, User } from 'lucide-react';
import { AmountChips, Button, Field, Notice, SummaryRow } from '../../components/ui';
import CardVisual from '../../components/CardVisual';
import { CARD_THEMES } from '../../lib/cardThemes';
import { AmountInput, FormPage, Section } from '../wallet/shared';
import { useAuth } from '../../context/AuthContext';
import { usePinPrompt, useToast } from '../../context/Overlays';
import { api } from '../../lib/api';
import { fcfa, usd } from '../../lib/format';

const BRANDS = [
  { key: 'VISA', label: 'Visa', text: 'Accepté partout' },
  { key: 'MASTERCARD', label: 'Mastercard', text: 'Idéal abonnements' },
];

const cleanHolder = (v) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z .'-]/g, '')
    .toUpperCase()
    .slice(0, 26);

export default function CreateCard() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const { profile, settings, refreshProfile } = useAuth();

  const [brand, setBrand] = useState('VISA');
  const [color, setColor] = useState('emerald');
  const [label, setLabel] = useState('');
  const [holder, setHolder] = useState(cleanHolder(profile?.full_name || ''));
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const rate = Number(settings?.usd_rate_fcfa ?? 650);
  const fee = Number(settings?.card_creation_fee_fcfa ?? 1000);
  const min = Number(settings?.card_min_initial_fcfa ?? 3000);
  const value = Number(amount) || 0;
  const usdValue = Math.round((value / rate) * 100) / 100;
  const total = value + fee;
  const balance = Number(profile?.balance_fcfa || 0);
  const insufficient = total > balance;
  const valid = value >= min && !insufficient && holder.trim().length >= 2;

  const preview = {
    label: label || 'Ma carte',
    brand,
    color,
    holder_name: holder || 'VOTRE NOM',
    last4: '0000',
    balance_usd: usdValue,
    status: 'ACTIVE',
  };

  const submit = async () => {
    setError('');
    const res = await confirmWithPin({
      title: `Créer la carte ${brand === 'VISA' ? 'Visa' : 'Mastercard'}`,
      subtitle: `${fcfa(total)} seront débités de votre solde`,
      action: (pin) => api.createCard({ brand, label, holder, initialFcfa: value, color }, pin),
    });
    if (res.ok) {
      await refreshProfile();
      toast.success('Votre carte est prête 🎉');
      navigate(`/cards/${res.result.card_id}`, { replace: true });
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <FormPage
      title="Nouvelle carte virtuelle"
      footer={
        <Button className="w-full" disabled={!valid} onClick={submit}>
          {value ? `Créer et payer ${fcfa(total)}` : 'Créer la carte'}
        </Button>
      }
    >
      <div className="pt-2">
        <CardVisual card={preview} />
      </div>

      <Section title="Réseau">
        <div className="grid grid-cols-2 gap-2">
          {BRANDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBrand(b.key)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                brand === b.key ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-100 bg-white'
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{b.label}</span>
                {brand === b.key && <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
              </span>
              <span className="text-xs text-slate-500">{b.text}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Couleur">
        <div className="flex gap-3">
          {Object.entries(CARD_THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setColor(key)}
              aria-label={t.name}
              title={t.name}
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.bg} ring-offset-2 ring-offset-slate-50 transition ${
                color === key ? 'ring-2 ring-emerald-600 scale-110' : ''
              }`}
            />
          ))}
        </div>
      </Section>

      <Section title="Personnalisation">
        <div className="space-y-3">
          <Field label="Nom de la carte" icon={Tag} maxLength={30} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Netflix, Shopping…" />
          <Field
            label="Nom du titulaire"
            icon={User}
            value={holder}
            onChange={(e) => setHolder(cleanHolder(e.target.value))}
            hint="Lettres sans accents, tel qu'il apparaîtra sur la carte"
          />
        </div>
      </Section>

      <Section title="Rechargement initial">
        <div className="bg-white rounded-3xl border border-slate-100 p-4">
          <AmountInput value={amount} onChange={setAmount} />
          <p className="text-center text-sm font-semibold text-emerald-700 -mt-1 mb-3">≈ {usd(usdValue)}</p>
          <AmountChips amounts={[3000, 5000, 10000, 20000, 50000]} onPick={(a) => setAmount(String(a))} />
          <p className={`text-xs mt-3 ${insufficient && value ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
            {insufficient && value
              ? `Solde insuffisant (${fcfa(balance)} disponibles)`
              : `Minimum ${fcfa(min)} · 1 USD = ${rate} FCFA`}
          </p>
        </div>
      </Section>

      {value > 0 && (
        <Section title="Récapitulatif">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-2">
            <SummaryRow label="Solde de la carte" value={usd(usdValue)} />
            <SummaryRow label="Rechargement" value={fcfa(value)} />
            <SummaryRow label="Frais de création" value={fcfa(fee)} />
            <div className="border-t border-slate-100 pt-2">
              <SummaryRow label="Total débité" value={fcfa(total)} strong />
            </div>
          </div>
        </Section>
      )}

      {insufficient && value > 0 && (
        <div className="mt-4">
          <Notice tone="warning">
            Rechargez d'abord votre solde.{' '}
            <button className="font-bold underline" onClick={() => navigate('/deposit')}>
              Faire un dépôt
            </button>
          </Notice>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </FormPage>
  );
}
