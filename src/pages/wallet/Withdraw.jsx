import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Notice, PhoneField, SummaryRow } from '../../components/ui';
import { AmountInput, FormPage, OperatorPicker, Section } from './shared';
import { useAuth } from '../../context/AuthContext';
import { usePinPrompt, useToast } from '../../context/Overlays';
import { api } from '../../lib/api';
import { fcfa, localPhone } from '../../lib/format';

export default function Withdraw() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const { profile, settings, refreshProfile } = useAuth();
  const [operator, setOperator] = useState('Orange Money');
  const [phone, setPhone] = useState(localPhone(profile?.phone));
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const value = Number(amount) || 0;
  const feePct = Number(settings?.withdraw_fee_percent ?? 1.5);
  const fee = Math.ceil((value * feePct) / 100);
  const total = value + fee;
  const balance = Number(profile?.balance_fcfa || 0);
  const min = settings?.min_withdraw_fcfa ?? 1000;
  const insufficient = total > balance;
  const valid = value >= min && !insufficient && phone.length === 8;

  const setMax = () => {
    const maxAmount = Math.floor(balance / (1 + feePct / 100));
    setAmount(String(Math.max(0, maxAmount)));
  };

  const submit = async () => {
    setError('');
    const res = await confirmWithPin({
      title: `Retirer ${fcfa(value)}`,
      subtitle: `vers ${operator} · +226 ${phone}`,
      action: (pin) => api.withdraw(value, operator, phone, pin),
    });
    if (res.ok) {
      await refreshProfile();
      toast.success('Retrait effectué');
      navigate('/', { replace: true });
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <FormPage
      title="Retirer vers Mobile Money"
      footer={
        <Button className="w-full" disabled={!valid} onClick={submit}>
          Continuer
        </Button>
      }
    >
      <Section title="Montant">
        <div className="bg-white rounded-3xl border border-slate-100 p-4">
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <div className="flex items-center justify-between text-xs">
            <span className={insufficient && value ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
              {insufficient && value ? 'Solde insuffisant' : `Disponible : ${fcfa(balance)}`}
            </span>
            <button onClick={setMax} className="font-bold text-emerald-700">
              Tout retirer
            </button>
          </div>
        </div>
      </Section>

      <Section title="Recevoir sur">
        <OperatorPicker value={operator} onChange={setOperator} />
      </Section>

      <Section>
        <PhoneField label={`Numéro ${operator}`} value={phone} onChange={setPhone} />
      </Section>

      {value > 0 && (
        <Section title="Récapitulatif">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-2">
            <SummaryRow label="Vous recevez" value={fcfa(value)} />
            <SummaryRow label={`Frais (${feePct} %)`} value={fcfa(fee)} />
            <div className="border-t border-slate-100 pt-2">
              <SummaryRow label="Débité de votre solde" value={fcfa(total)} strong />
            </div>
          </div>
        </Section>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </FormPage>
  );
}
