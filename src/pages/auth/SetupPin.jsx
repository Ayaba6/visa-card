import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import PinPad from '../../components/PinPad';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { firstName } from '../../lib/format';

/** Création du code PIN (premier lancement ou après « PIN oublié »). */
export default function SetupPin() {
  const { profile, refreshProfile, setUnlocked, signOut } = useAuth();
  const [first, setFirst] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const name = firstName(profile?.full_name);

  const onComplete = async (pin) => {
    if (!first) {
      if (/^(\d)\1{3}$/.test(pin) || ['1234', '4321', '0123'].includes(pin)) {
        setError('Code trop simple, choisissez-en un autre');
        setResetKey((k) => k + 1);
        return;
      }
      setFirst(pin);
      setError('');
      setResetKey((k) => k + 1);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      setError('Les codes ne correspondent pas, recommencez');
      setResetKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      await api.setPin(pin);
      setUnlocked(true);
      await refreshProfile();
    } catch (err) {
      setError(err.message);
      setFirst(null);
      setResetKey((k) => k + 1);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
    <div className="min-h-full flex flex-col px-6 pb-6">
      <div className="h-14 shrink-0 flex items-center justify-end">
        <button onClick={signOut} className="text-sm font-semibold text-slate-400 hover:text-slate-600">
          Se déconnecter
        </button>
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-4">
          {first ? 'Confirmez votre code' : `Bienvenue${name ? ` ${name}` : ''} !`}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-[280px]">
          {first
            ? 'Saisissez à nouveau votre code PIN.'
            : 'Créez un code PIN à 4 chiffres. Il protège l’accès à l’app et valide vos opérations.'}
        </p>
      </div>
      <div className="mt-auto pt-6">
        <PinPad onComplete={onComplete} loading={loading} error={error} resetKey={resetKey} />
      </div>
    </div>
    </div>
  );
}
