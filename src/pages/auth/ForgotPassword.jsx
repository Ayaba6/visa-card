import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Button, Field, Notice } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (err) setError(humanError(err));
    else setSent(true);
  };

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Recevez un lien pour choisir un nouveau mot de passe.">
      {sent ? (
        <div className="flex flex-col items-center text-center pt-2">
          <span className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MailCheck className="w-8 h-8" />
          </span>
          <p className="text-sm text-slate-600 mt-5">
            Si un compte existe pour <strong>{email}</strong>, un email vient d'être envoyé. Ouvrez le lien depuis cet
            appareil.
          </p>
          <Link to="/login" className="w-full mt-8">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Email" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
          <Button type="submit" loading={loading} className="w-full">
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
