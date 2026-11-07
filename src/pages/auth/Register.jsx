import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, MailCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Button, Field, Notice } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';
import { digitsOnly, normalizePhone } from '../../lib/format';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' });
  const [accept, setAccept] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.fullName.trim().split(/\s+/).length < 2) return setError('Entrez votre prénom et votre nom.');
    if (digitsOnly(form.phone).length !== 8) return setError('Le numéro doit contenir 8 chiffres.');
    if (form.password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.');
    if (!accept) return setError("Acceptez les conditions d'utilisation pour continuer.");

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim(), phone: normalizePhone(form.phone) },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (err) return setError(humanError(err));
    // Si la confirmation d'email est activée, aucune session n'est ouverte.
    if (!data.session) setSentTo(form.email.trim());
  };

  if (sentTo) {
    return (
      <AuthLayout title="Vérifiez vos emails" back={false}>
        <div className="flex flex-col items-center text-center pt-4">
          <span className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MailCheck className="w-8 h-8" />
          </span>
          <p className="text-sm text-slate-600 mt-5">
            Nous avons envoyé un lien de confirmation à <strong>{sentTo}</strong>. Cliquez dessus puis revenez vous
            connecter.
          </p>
          <Link to="/login" className="w-full mt-8">
            <Button className="w-full">Aller à la connexion</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Gratuit, en moins d'une minute."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-bold text-emerald-700">
            Connectez-vous
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Nom complet" icon={User} required autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="Awa Ouédraogo" />
        <Field
          label="Numéro Mobile Money / WhatsApp"
          required
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={11}
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: digitsOnly(e.target.value).slice(0, 8) }))}
          placeholder="70 00 00 00"
          right={null}
          icon={() => <span className="text-sm font-semibold text-slate-500">🇧🇫 +226</span>}
        />
        <Field label="Email" icon={Mail} type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" />
        <Field
          label="Mot de passe"
          icon={Lock}
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          placeholder="8 caractères minimum"
          right={
            <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600" aria-label="Afficher le mot de passe">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <Field
          label="Confirmer le mot de passe"
          icon={Lock}
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          placeholder="••••••••"
        />
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-emerald-600"
          />
          J'accepte les conditions d'utilisation et la politique de confidentialité de Kodapay.
        </label>
        <Button type="submit" loading={loading} className="w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  );
}
