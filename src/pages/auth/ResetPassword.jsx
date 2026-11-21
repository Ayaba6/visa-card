import { useState } from 'react';
import { Lock } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Button, Field, Notice } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/Overlays';

export default function ResetPassword() {
  const { setRecovery } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('8 caractères minimum.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(humanError(err));
    toast.success('Mot de passe mis à jour');
    setRecovery(false);
  };

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs." back={false}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Nouveau mot de passe" icon={Lock} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirmer" icon={Lock} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">
          Enregistrer
        </Button>
      </form>
    </AuthLayout>
  );
}
