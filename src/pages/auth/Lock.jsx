import { useState } from 'react';
import { Lock as LockIcon } from 'lucide-react';
import PinPad from '../../components/PinPad';
import Sheet from '../../components/Sheet';
import { Button, Field, Notice } from '../../components/ui';
import { Logo } from './AuthLayout';
import { api, humanError } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { firstName, initials } from '../../lib/format';

/** Écran de déverrouillage par code PIN. */
export default function Lock() {
  const { profile, user, setUnlocked, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);

  const onComplete = async (pin) => {
    setLoading(true);
    setError('');
    try {
      await api.verifyPin(pin);
      setUnlocked(true);
    } catch (err) {
      setError(err.message);
      setResetKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-emerald-950 text-white">
    <div className="min-h-full flex flex-col px-6 pb-6">
      <div className="h-14 shrink-0 flex items-center justify-between">
        <Logo light size="text-xl" />
        <button onClick={signOut} className="text-sm font-semibold text-emerald-200/70 hover:text-white">
          Changer de compte
        </button>
      </div>

      <div className="flex flex-col items-center text-center mt-2">
        <span className="w-14 h-14 rounded-full bg-emerald-400 text-emerald-950 text-xl font-extrabold flex items-center justify-center">
          {initials(profile?.full_name)}
        </span>
        <h1 className="text-xl font-bold mt-3">Bonjour{profile?.full_name ? ` ${firstName(profile.full_name)}` : ''}</h1>
        <p className="text-sm text-emerald-100/60 mt-1">Saisissez votre code PIN</p>
      </div>

      <div className="mt-auto pt-6">
        <PinPad dark onComplete={onComplete} loading={loading} error={error} resetKey={resetKey} />
        <button
          onClick={() => setForgotOpen(true)}
          className="block mx-auto mt-4 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          Code PIN oublié ?
        </button>
      </div>
    </div>

      <ForgotPinSheet
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        email={user?.email}
        onDone={refreshProfile}
      />
    </div>
  );
}

function ForgotPinSheet({ open, onClose, email, onDone }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw new Error(humanError(err));
      await api.resetPinAfterLogin();
      await onDone();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Réinitialiser le code PIN">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Confirmez le mot de passe du compte <strong className="text-slate-800">{email}</strong> pour créer un nouveau
          code PIN.
        </p>
        {error && <Notice tone="error">{error}</Notice>}
        <Field
          label="Mot de passe"
          icon={LockIcon}
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          Continuer
        </Button>
      </form>
    </Sheet>
  );
}
