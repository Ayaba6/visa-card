import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, MailCheck, Check, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Button, Field, Notice, PhoneField } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';
import { normalizePhone } from '../../lib/format';
import { isStrongPassword, isValidEmail, isValidName, PASSWORD_RULES, passwordScore } from '../../lib/validation';
import { useToast } from '../../context/Overlays';

const STEPS = [
  { label: 'Identité', title: 'Faisons connaissance', subtitle: 'Indiquez votre nom tel qu’il figure sur votre pièce d’identité.' },
  { label: 'Coordonnées', title: 'Vos coordonnées', subtitle: 'Votre numéro permet à vos proches de vous envoyer de l’argent sur Kodapay.' },
  { label: 'Sécurité', title: 'Sécurisez votre compte', subtitle: 'Choisissez un mot de passe solide que vous n’utilisez nulle part ailleurs.' },
];

const STRENGTH = [
  { label: 'Trop faible', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Faible', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Bon', color: 'bg-emerald-500', text: 'text-emerald-600' },
  { label: 'Excellent', color: 'bg-emerald-600', text: 'text-emerald-700' },
];

function PasswordStrength({ password }) {
  const score = passwordScore(password);
  const s = STRENGTH[score];
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? s.color : 'bg-slate-100'}`} />
          ))}
        </div>
        {password && <span className={`text-xs font-bold w-20 text-right ${s.text}`}>{s.label}</span>}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.key} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
              </span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', confirm: '' });
  const [accept, setAccept] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [sentTo, setSentTo] = useState('');

  /** Met à jour un champ et efface son erreur éventuelle. */
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };
  const set = (key) => (e) => update(key, e.target.value);

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!isValidName(form.firstName)) e.firstName = 'Entrez votre prénom';
      if (!isValidName(form.lastName)) e.lastName = 'Entrez votre nom';
    }
    if (s === 1) {
      if (form.phone.length !== 8) e.phone = 'Le numéro doit contenir 8 chiffres';
      if (!isValidEmail(form.email)) e.email = 'Adresse email invalide';
    }
    if (s === 2) {
      if (!isStrongPassword(form.password)) e.password = 'Mot de passe trop faible';
      if (form.confirm !== form.password) e.confirm = 'Les mots de passe ne correspondent pas';
      if (!accept) e.accept = 'Vous devez accepter les conditions pour continuer';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate(step)) return;
    if (step < 2) setStep(step + 1);
    else submit();
  };

  const back = () => {
    setServerError('');
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const submit = async () => {
    setLoading(true);
    const email = form.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: normalizePhone(form.phone),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      const msg = humanError(error);
      setServerError(msg);
      // Renvoie à l'étape concernée
      if (/email/i.test(msg)) setStep(1);
      if (/numéro/i.test(msg)) setStep(1);
      return;
    }
    // Si la confirmation d'email est activée, aucune session n'est ouverte.
    if (!data.session) setSentTo(email);
  };

  if (sentTo) return <CheckEmail email={sentTo} />;

  const current = STEPS[step];
  const passwordToggle = (
    <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600" aria-label="Afficher le mot de passe">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthLayout
      title={current.title}
      subtitle={current.subtitle}
      onBack={back}
      step={{ current: step + 1, total: STEPS.length, label: current.label }}
      topRight={
        <span className="hidden sm:inline">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            Se connecter
          </Link>
        </span>
      }
      footer={
        <span className="sm:hidden">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-bold text-emerald-700">
            Se connecter
          </Link>
        </span>
      }
    >
      <form onSubmit={next} noValidate className="space-y-5" key={step}>
        {serverError && <Notice tone="error">{serverError}</Notice>}

        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <Field
              label="Prénom"
              icon={User}
              autoFocus
              autoComplete="given-name"
              value={form.firstName}
              onChange={set('firstName')}
              placeholder="Awa"
              error={errors.firstName}
            />
            <Field
              label="Nom"
              icon={User}
              autoComplete="family-name"
              value={form.lastName}
              onChange={set('lastName')}
              placeholder="Ouédraogo"
              error={errors.lastName}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <PhoneField
              label="Numéro de téléphone"
              autoFocus
              value={form.phone}
              onChange={(phone) => update('phone', phone)}
              error={errors.phone}
              hint="Orange Money, Moov Money ou Wave"
            />
            <Field
              label="Adresse email"
              icon={Mail}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              placeholder="vous@exemple.com"
              error={errors.email}
              hint="Vous y recevrez un lien de confirmation."
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <Field
                label="Mot de passe"
                icon={Lock}
                autoFocus
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Créez un mot de passe"
                error={errors.password}
                right={passwordToggle}
              />
              <PasswordStrength password={form.password} />
            </div>
            <Field
              label="Confirmer le mot de passe"
              icon={Lock}
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Saisissez-le à nouveau"
              error={errors.confirm}
              right={
                form.confirm && form.confirm === form.password ? (
                  <Check className="w-[18px] h-[18px] text-emerald-600" strokeWidth={3} />
                ) : null
              }
            />
            <div>
              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer select-none transition ${
                  accept ? 'border-emerald-200 bg-emerald-50/50' : errors.accept ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(e) => {
                    setAccept(e.target.checked);
                    setErrors((er) => ({ ...er, accept: undefined }));
                  }}
                  className="mt-0.5 w-5 h-5 accent-emerald-600 shrink-0"
                />
                <span className="text-sm text-slate-600 leading-relaxed">
                  J’accepte les <span className="font-semibold text-slate-900">conditions d’utilisation</span> et la{' '}
                  <span className="font-semibold text-slate-900">politique de confidentialité</span> de Kodapay.
                </span>
              </label>
              {errors.accept && <p className="text-xs text-rose-600 mt-1.5">{errors.accept}</p>}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
          {step < 2 ? (
            <>
              Continuer <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Créer mon compte'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Écran affiché après l'inscription quand Supabase demande de confirmer l'email. */
function CheckEmail({ email }) {
  const toast = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const resend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) return toast.error(humanError(error));
    toast.success('Email renvoyé');
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);
  };

  return (
    <AuthLayout
      back={false}
      icon={MailCheck}
      title="Vérifiez votre boîte mail"
      subtitle={
        <>
          Nous avons envoyé un lien de confirmation à <strong className="text-slate-900">{email}</strong>.
        </>
      }
    >
      <ol className="space-y-4">
        {['Ouvrez l’email envoyé par Kodapay', 'Cliquez sur le lien de confirmation', 'Connectez-vous et créez votre code PIN'].map((t, i) => (
          <li key={t} className="flex items-center gap-4">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-slate-700">{t}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-400 mt-6">Pensez à vérifier le dossier « Spam » ou « Promotions ».</p>
      <Link to="/login" className="block mt-8">
        <Button size="lg" className="w-full">Aller à la connexion</Button>
      </Link>
      <Button variant="ghost" className="w-full mt-2" loading={resending} disabled={cooldown} onClick={resend}>
        {cooldown ? 'Email renvoyé · patientez 1 min' : 'Je n’ai rien reçu, renvoyer l’email'}
      </Button>
    </AuthLayout>
  );
}
