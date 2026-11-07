import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PinPad from '../../components/PinPad';
import { PageHeader } from '../../components/ui';
import { api } from '../../lib/api';
import { useToast } from '../../context/Overlays';

const STEPS = {
  current: 'Saisissez votre code PIN actuel',
  next: 'Choisissez un nouveau code PIN',
  confirm: 'Confirmez le nouveau code PIN',
};

export default function ChangePin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState('current');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const reset = (msg, toStep) => {
    setError(msg);
    setStep(toStep);
    setResetKey((k) => k + 1);
  };

  const onComplete = async (pin) => {
    setError('');
    if (step === 'current') {
      setLoading(true);
      try {
        await api.verifyPin(pin);
        setCurrent(pin);
        reset('', 'next');
      } catch (err) {
        reset(err.message, 'current');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 'next') {
      if (pin === current) return reset('Le nouveau code doit être différent', 'next');
      if (/^(\d)\1{3}$/.test(pin) || ['1234', '4321', '0123'].includes(pin)) {
        return reset('Code trop simple, choisissez-en un autre', 'next');
      }
      setNext(pin);
      return reset('', 'confirm');
    }
    if (pin !== next) return reset('Les codes ne correspondent pas', 'next');
    setLoading(true);
    try {
      await api.setPin(pin, current);
      toast.success('Code PIN modifié');
      navigate(-1);
    } catch (err) {
      setLoading(false);
      reset(err.message, 'current');
    }
  };

  return (
    <>
      <PageHeader title="Changer le code PIN" />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col px-6 pb-6">
        <p className="text-center text-lg font-bold text-slate-900 mt-4">{STEPS[step]}</p>
        <div className="mt-auto pt-6">
          <PinPad onComplete={onComplete} loading={loading} error={error} resetKey={resetKey} />
        </div>
        </div>
      </div>
    </>
  );
}
