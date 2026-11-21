import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserCheck, UserX } from 'lucide-react';
import { Button, Field, Notice, PhoneField, Spinner, SummaryRow } from '../../components/ui';
import { AmountInput, FormPage, Section } from './shared';
import { useAuth } from '../../context/AuthContext';
import { usePinPrompt, useToast } from '../../context/Overlays';
import { api } from '../../lib/api';
import { fcfa } from '../../lib/format';

export default function Transfer() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirmWithPin = usePinPrompt();
  const { profile, settings, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState(null); // { found, name, self }
  const [looking, setLooking] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const value = Number(amount) || 0;
  const fee = Number(settings?.transfer_fee_fcfa ?? 0);
  const balance = Number(profile?.balance_fcfa || 0);
  const min = settings?.min_transfer_fcfa ?? 100;
  const insufficient = value + fee > balance;
  const valid = recipient?.found && value >= min && !insufficient;

  // Recherche du destinataire dès que 8 chiffres sont saisis
  useEffect(() => {
    if (phone.length !== 8) {
      setRecipient(null);
      return;
    }
    let cancelled = false;
    setLooking(true);
    api
      .lookupRecipient(phone)
      .then((r) => !cancelled && setRecipient(r))
      .catch(() => !cancelled && setRecipient({ found: false }))
      .finally(() => !cancelled && setLooking(false));
    return () => {
      cancelled = true;
    };
  }, [phone]);

  const submit = async () => {
    setError('');
    const res = await confirmWithPin({
      title: `Envoyer ${fcfa(value)}`,
      subtitle: `à ${recipient.name}`,
      action: (pin) => api.transfer(phone, value, note, pin),
    });
    if (res.ok) {
      await refreshProfile();
      toast.success(`${fcfa(value)} envoyés à ${recipient.name}`);
      navigate('/', { replace: true });
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <FormPage
      title="Envoyer de l'argent"
      footer={
        <Button className="w-full" disabled={!valid} onClick={submit}>
          Continuer
        </Button>
      }
    >
      <Section title="Destinataire">
        <PhoneField
          label="Numéro Kodapay du destinataire"
          autoFocus
          autoComplete="off"
          value={phone}
          onChange={setPhone}
          right={looking ? <Spinner className="w-4 h-4" /> : null}
        />
        {recipient && (
          <div
            className={`mt-2 flex items-center gap-2 text-sm font-semibold rounded-2xl px-3.5 py-2.5 ${
              recipient.found ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {recipient.found ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            {recipient.found
              ? recipient.name
              : recipient.self
                ? "C'est votre propre numéro"
                : 'Aucun compte Kodapay avec ce numéro'}
          </div>
        )}
      </Section>

      <Section title="Montant">
        <div className="bg-white rounded-3xl border border-slate-100 p-4">
          <AmountInput value={amount} onChange={setAmount} />
          <p className={`text-xs ${insufficient && value ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
            {insufficient && value ? 'Solde insuffisant' : `Disponible : ${fcfa(balance)}`}
          </p>
        </div>
      </Section>

      <Section>
        <Field label="Motif (facultatif)" icon={MessageSquare} maxLength={60} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : remboursement" />
      </Section>

      {value > 0 && recipient?.found && (
        <Section title="Récapitulatif">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-2">
            <SummaryRow label="Montant envoyé" value={fcfa(value)} />
            <SummaryRow label="Frais" value={fee ? fcfa(fee) : 'Gratuit'} />
            <div className="border-t border-slate-100 pt-2">
              <SummaryRow label="Total débité" value={fcfa(value + fee)} strong />
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
