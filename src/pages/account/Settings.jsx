import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRound,
  KeyRound,
  Lock,
  Bell,
  BadgeCheck,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import InstallSheet from '../../components/InstallSheet';
import { useInstallPrompt } from '../../lib/pwa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/Overlays';
import { supabase } from '../../lib/supabase';
import { humanError } from '../../lib/api';
import { initials } from '../../lib/format';
import Sheet from '../../components/Sheet';
import { Button, Field, Notice, PageHeader } from '../../components/ui';

const KYC = {
  VERIFIED: { label: 'Compte vérifié', cls: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Vérification en cours', cls: 'bg-amber-50 text-amber-700' },
  UNVERIFIED: { label: 'Non vérifié', cls: 'bg-slate-100 text-slate-600' },
};

function Item({ icon: Icon, label, sub, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-semibold ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{label}</span>
        {sub && <span className="block text-xs text-slate-400 truncate">{sub}</span>}
      </span>
      {!danger && <ChevronRight className="w-4 h-4 text-slate-300" />}
    </button>
  );
}

function Group({ title, children }) {
  return (
    <section className="mt-5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">{title}</h2>
      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">{children}</div>
    </section>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, user, setUnlocked, signOut } = useAuth();
  const [sheet, setSheet] = useState(null);
  const { installed } = useInstallPrompt();
  const kyc = KYC[profile?.kyc_status] || KYC.UNVERIFIED;

  return (
    <>
      <PageHeader title="Mon compte" back={false} />
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-white rounded-3xl border border-slate-100 p-4 flex items-center gap-4 text-left hover:bg-slate-50"
        >
          <span className="w-14 h-14 rounded-full bg-emerald-600 text-white text-lg font-extrabold flex items-center justify-center">
            {initials(profile?.full_name)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-slate-900 truncate">{profile?.full_name || 'Sans nom'}</span>
            <span className="block text-sm text-slate-500 truncate">{profile?.phone || user?.email}</span>
            <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${kyc.cls}`}>{kyc.label}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        <Group title="Compte">
          <Item icon={UserRound} label="Informations personnelles" sub="Nom, téléphone" onClick={() => navigate('/profile')} />
          <Item icon={BadgeCheck} label="Vérification d'identité" sub={kyc.label} onClick={() => setSheet('kyc')} />
          <Item icon={Bell} label="Notifications" onClick={() => navigate('/notifications')} />
          {!installed && (
            <Item icon={Smartphone} label="Installer l'application" sub="Sur votre écran d'accueil" onClick={() => setSheet('install')} />
          )}
        </Group>

        <Group title="Sécurité">
          <Item icon={KeyRound} label="Changer le code PIN" onClick={() => navigate('/security/pin')} />
          <Item icon={Lock} label="Changer le mot de passe" sub={user?.email} onClick={() => setSheet('password')} />
          <Item
            icon={ShieldAlert}
            label="Verrouiller l'application"
            sub="Le code PIN sera redemandé"
            onClick={() => {
              setUnlocked(false);
              toast.info('Application verrouillée');
            }}
          />
        </Group>

        <Group title="Aide">
          <Item icon={HelpCircle} label="Centre d'aide" onClick={() => setSheet('help')} />
          <Item icon={FileText} label="Conditions d'utilisation" onClick={() => setSheet('terms')} />
        </Group>

        <div className="mt-5 bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <Item icon={LogOut} label="Se déconnecter" danger onClick={signOut} />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Kodapay · version 2.1 · un service de Kodalink</p>
      </div>

      <PasswordSheet open={sheet === 'password'} onClose={() => setSheet(null)} />
      <InstallSheet open={sheet === 'install'} onClose={() => setSheet(null)} />

      <Sheet open={sheet === 'kyc'} onClose={() => setSheet(null)} title="Vérification d'identité">
        <p className="text-sm text-slate-600">
          La vérification (pièce d'identité + selfie) permettra d'augmenter vos plafonds. Elle sera disponible
          prochainement.
        </p>
        <Button variant="outline" className="w-full mt-5" onClick={() => setSheet(null)}>
          Compris
        </Button>
      </Sheet>

      <Sheet open={sheet === 'help'} onClose={() => setSheet(null)} title="Centre d'aide">
        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">Comment payer en ligne ?</p>
            <p>Ouvrez votre carte, touchez « Afficher les détails » puis copiez le numéro, la date et le CVV sur le site marchand.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Mon paiement est refusé</p>
            <p>Vérifiez que la carte n'est pas gelée et que son solde en USD couvre le montant (frais du marchand inclus).</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">J'ai oublié mon code PIN</p>
            <p>Sur l'écran de déverrouillage, touchez « Code PIN oublié ? » et confirmez votre mot de passe.</p>
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === 'terms'} onClose={() => setSheet(null)} title="Conditions d'utilisation">
        <p className="text-sm text-slate-600">
          Les conditions générales d'utilisation de Kodapay seront publiées ici. Rédigez-les avec un juriste avant la
          mise en production.
        </p>
      </Sheet>
    </>
  );
}

function PasswordSheet({ open, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('8 caractères minimum.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(humanError(err));
    toast.success('Mot de passe modifié');
    setPassword('');
    setConfirm('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Changer le mot de passe">
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Nouveau mot de passe" icon={Lock} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirmer" icon={Lock} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>
          Enregistrer
        </Button>
      </form>
    </Sheet>
  );
}
