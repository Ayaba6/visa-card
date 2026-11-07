import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { AmountChips, Button, Field, Notice } from '../../components/ui';
import { AmountInput, FormPage, OperatorPicker, Section } from './shared';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/Overlays';
import { api } from '../../lib/api';
import { digitsOnly, fcfa } from '../../lib/format';

export default function Deposit() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, settings, refreshProfile } = useAuth();
  const [operator, setOperator] = useState('Orange Money');
  const [phone, setPhone] = useState(digitsOnly(profile?.phone).slice(-8));
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const value = Number(amount) || 0;
  const min = settings?.min_deposit_fcfa ?? 500;
  const max = settings?.max_deposit_fcfa ?? 2000000;
  const valid = value >= min && value <= max && digitsOnly(phone).length === 8;

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.deposit(value, operator, phone);
      await refreshProfile();
      toast.success(`${fcfa(value)} ajoutés à votre solde`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <FormPage
      title="Déposer de l'argent"
      footer={
        <Button className="w-full" disabled={!valid} loading={loading} onClick={submit}>
          {value ? `Déposer ${fcfa(value)}` : 'Déposer'}
        </Button>
      }
    >
      <Section title="Montant">
        <div className="bg-white rounded-3xl border border-slate-100 p-4">
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <AmountChips amounts={[2000, 5000, 10000, 25000, 50000]} onPick={(a) => setAmount(String(a))} />
          <p className="text-xs text-slate-400 mt-3">
            Minimum {fcfa(min)} · Maximum {fcfa(max)}
          </p>
        </div>
      </Section>

      <Section title="Payer avec">
        <OperatorPicker value={operator} onChange={setOperator} />
      </Section>

      <Section>
        <Field
          label={`Numéro ${operator}`}
          icon={Phone}
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 8))}
          placeholder="70 00 00 00"
        />
      </Section>

      <div className="mt-5 space-y-3">
        {settings?.simulation_mode ? (
          <Notice tone="warning">
            Mode démo : le dépôt est crédité immédiatement, sans paiement réel. En production, l'utilisateur
            validera la demande sur son téléphone ({operator}).
          </Notice>
        ) : (
          <Notice>Vous allez recevoir une demande de paiement {operator} à valider sur votre téléphone.</Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </FormPage>
  );
}
