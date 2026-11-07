import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Button, Field, Notice } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError(humanError(err));
    // En cas de succès, AuthContext détecte la session et affiche la suite.
  };

  return (
    <AuthLayout
      title="Bon retour 👋"
      subtitle="Connectez-vous pour accéder à vos cartes."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-bold text-emerald-700">
            Inscrivez-vous
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
        />
        <Field
          label="Mot de passe"
          icon={Lock}
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          right={
            <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600" aria-label="Afficher le mot de passe">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-emerald-700">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
