import { Link } from 'react-router-dom';
import {
  Zap,
  Smartphone,
  Snowflake,
  ShieldCheck,
  Send,
  ReceiptText,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
} from 'lucide-react';
import CardVisual from '../components/CardVisual';
import { useInstallPrompt } from '../lib/pwa';
import { Logo } from './auth/AuthLayout';
import { api } from '../lib/api';
import { useLoad } from '../lib/useLoad';
import { fcfa } from '../lib/format';

const HERO_CARDS = [
  { label: 'Abonnements', brand: 'MASTERCARD', holder_name: 'AWA OUEDRAOGO', last4: '7730', balance_usd: 38, color: 'midnight', expiry_month: 3, expiry_year: 2029 },
  { label: 'Shopping', brand: 'VISA', holder_name: 'AWA OUEDRAOGO', last4: '4821', balance_usd: 124.5, color: 'emerald', expiry_month: 9, expiry_year: 2029 },
];

const MERCHANTS = ['Netflix', 'Amazon', 'AliExpress', 'Spotify', 'Google Play', 'Canva', 'Apple', 'Udemy'];

const FEATURES = [
  { icon: Zap, title: 'Carte prête en 1 minute', text: 'Créez une carte Visa ou Mastercard virtuelle en dollars, directement depuis votre téléphone ou votre ordinateur.' },
  { icon: Smartphone, title: 'Rechargez par Mobile Money', text: 'Alimentez votre solde avec Orange Money, Moov Money ou Wave, puis transférez sur vos cartes.' },
  { icon: Snowflake, title: 'Gardez le contrôle', text: 'Gelez une carte en un geste, dégelez-la quand vous voulez, ou supprimez-la : le solde restant vous est remboursé.' },
  { icon: ShieldCheck, title: 'Sécurisé par code PIN', text: 'Chaque opération sensible est validée par votre code PIN. Le numéro complet et le CVV ne s’affichent qu’à votre demande.' },
  { icon: Send, title: 'Transferts entre amis', text: 'Envoyez de l’argent à un autre utilisateur Kodapay avec son simple numéro de téléphone.' },
  { icon: ReceiptText, title: 'Historique clair', text: 'Chaque dépôt, achat et recharge est enregistré avec sa référence, ses frais et son statut.' },
];

const STEPS = [
  { title: 'Créez votre compte', text: 'Nom, numéro et email : c’est gratuit et ça prend moins d’une minute.' },
  { title: 'Rechargez votre solde', text: 'Déposez des FCFA depuis votre compte Orange Money, Moov Money ou Wave.' },
  { title: 'Créez votre carte et payez', text: 'Choisissez Visa ou Mastercard, rechargez-la et payez sur vos sites préférés.' },
];

const FAQ = [
  {
    q: 'Où puis-je utiliser ma carte Kodapay ?',
    a: 'Sur les sites et applications qui acceptent les cartes Visa ou Mastercard pour les paiements en ligne : abonnements, achats, services numériques, réservations…',
  },
  {
    q: 'Dans quelle devise est ma carte ?',
    a: 'Les cartes sont en dollars américains (USD). Vous rechargez en FCFA et la conversion se fait au taux affiché dans l’application avant chaque opération.',
  },
  {
    q: 'Puis-je récupérer l’argent qui reste sur une carte ?',
    a: 'Oui. Vous pouvez retirer le solde d’une carte vers votre solde Kodapay à tout moment, ou supprimer la carte : le solde restant est alors remboursé.',
  },
  {
    q: 'Que se passe-t-il si j’oublie mon code PIN ?',
    a: 'Sur l’écran de déverrouillage, touchez « Code PIN oublié ? », confirmez votre mot de passe puis créez un nouveau code.',
  },
  {
    q: 'Puis-je utiliser Kodapay sur ordinateur ?',
    a: 'Oui. Kodapay fonctionne dans le navigateur, sur téléphone comme sur ordinateur, avec le même compte.',
  },
];

function Section({ id, eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{eyebrow}</p>}
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">{title}</h2>
          {subtitle && <p className="text-lg text-slate-500 mt-3">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function PriceRow({ label, value }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="flex items-center gap-3 text-slate-600">
        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
        {label}
      </span>
      <span className="font-bold text-slate-900 whitespace-nowrap">{value}</span>
    </li>
  );
}

/** Page de présentation affichée aux visiteurs sur ordinateur. */
export default function Landing() {
  const { data: s } = useLoad(() => api.settings(), []);
  const { installed, canPrompt, install } = useInstallPrompt();

  return (
    <div className="h-[100dvh] overflow-y-auto bg-white text-slate-900 scroll-smooth">
      {/* Navigation */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fonctionnalites" className="hover:text-emerald-700">Fonctionnalités</a>
            <a href="#comment" className="hover:text-emerald-700">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-emerald-700">Tarifs</a>
            <a href="#faq" className="hover:text-emerald-700">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {!installed && canPrompt && (
              <button
                onClick={install}
                className="h-10 px-4 rounded-full text-sm font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Installer l’app
              </button>
            )}
            <Link to="/login" className="h-10 px-4 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center">
              Se connecter
            </Link>
            <Link to="/register" className="h-10 px-5 rounded-full text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {s?.simulation_mode && (
        <div className="bg-amber-50 text-amber-800 text-sm text-center px-6 py-2 border-b border-amber-100">
          Version de démonstration : les paiements sont simulés pour le moment.
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <span className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-emerald-500/20 blur-3xl" />
        <span className="absolute -bottom-48 -left-32 w-[420px] h-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 rounded-full px-4 py-1.5 text-emerald-200">
              🇧🇫 Pensé pour le Burkina Faso
            </p>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.05] mt-6">
              Payez en ligne partout, <span className="text-emerald-300">avec votre Mobile Money.</span>
            </h1>
            <p className="text-lg text-emerald-50/80 mt-6 max-w-xl">
              Kodapay vous donne une carte Visa ou Mastercard virtuelle en dollars, rechargeable avec Orange Money,
              Moov Money ou Wave. Abonnements, achats, services en ligne : tout devient possible.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/register"
                className="h-14 px-7 rounded-2xl bg-emerald-400 text-emerald-950 font-bold flex items-center gap-2 hover:bg-emerald-300 transition"
              >
                Créer ma carte gratuitement <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="h-14 px-7 rounded-2xl border border-white/20 font-semibold flex items-center hover:bg-white/10 transition">
                J’ai déjà un compte
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-8 text-sm">
              {['Orange Money', 'Moov Money', 'Wave'].map((op) => (
                <span key={op} className="px-3 py-1.5 rounded-full bg-white/10 text-emerald-50/90">
                  {op}
                </span>
              ))}
            </div>
          </div>

          <div className="relative h-[380px] hidden md:block">
            <div className="absolute w-[400px] right-6 top-0 rotate-[8deg] opacity-90">
              <CardVisual card={HERO_CARDS[0]} />
            </div>
            <div className="absolute w-[420px] right-24 top-28 -rotate-[4deg] shadow-2xl rounded-[22px]">
              <CardVisual card={HERO_CARDS[1]} />
            </div>
          </div>
        </div>
      </section>

      {/* Marchands */}
      <div className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <span className="text-sm text-slate-400 font-medium">Utilisable sur :</span>
          {MERCHANTS.map((m) => (
            <span key={m} className="text-lg font-bold text-slate-300">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Fonctionnalités */}
      <Section
        id="fonctionnalites"
        eyebrow="Fonctionnalités"
        title="Tout ce qu’il faut pour payer en ligne sans carte bancaire"
        subtitle="Une application simple, pensée pour le Mobile Money."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-7 hover:border-emerald-200 hover:bg-emerald-50/40 transition">
              <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold mt-5">{title}</h3>
              <p className="text-slate-500 mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Comment ça marche */}
      <Section id="comment" eyebrow="Comment ça marche" title="Votre première carte en 3 étapes" className="bg-slate-50">
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-3xl bg-white border border-slate-100 p-7">
              <span className="text-5xl font-extrabold text-emerald-100">0{i + 1}</span>
              <h3 className="text-lg font-bold mt-2">{step.title}</h3>
              <p className="text-slate-500 mt-2 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tarifs */}
      <Section
        id="tarifs"
        eyebrow="Tarifs"
        title="Des frais simples, affichés avant chaque opération"
        subtitle="Pas d’abonnement, pas de frais cachés : vous voyez toujours le total avant de valider."
      >
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold">Carte virtuelle</h3>
            <ul className="mt-4">
              <PriceRow label="Création d’une carte" value={s ? fcfa(s.card_creation_fee_fcfa) : '—'} />
              <PriceRow label="Rechargement initial minimum" value={s ? fcfa(s.card_min_initial_fcfa) : '—'} />
              <PriceRow label="Recharge de carte" value={s ? `${Number(s.card_fund_fee_percent)} %` : '—'} />
              <PriceRow label="Taux de conversion" value={s ? `1 USD = ${Number(s.usd_rate_fcfa)} FCFA` : '—'} />
              <PriceRow label="Gel / dégel de la carte" value="Gratuit" />
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold">Solde Kodapay</h3>
            <ul className="mt-4">
              <PriceRow label="Ouverture du compte" value="Gratuit" />
              <PriceRow label="Dépôt Mobile Money" value="Gratuit" />
              <PriceRow label="Retrait vers Mobile Money" value={s ? `${Number(s.withdraw_fee_percent)} %` : '—'} />
              <PriceRow
                label="Transfert entre utilisateurs"
                value={s ? (Number(s.transfer_fee_fcfa) ? fcfa(s.transfer_fee_fcfa) : 'Gratuit') : '—'}
              />
              <PriceRow label="Nombre de cartes" value={s ? `Jusqu’à ${s.max_active_cards}` : '—'} />
            </ul>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Questions fréquentes" className="bg-slate-50">
        <div className="max-w-3xl space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl bg-white border border-slate-100 px-6 py-5 open:shadow-sm">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-slate-900">
                {q}
                <ChevronDown className="w-5 h-5 text-slate-400 transition group-open:rotate-180 shrink-0" />
              </summary>
              <p className="text-slate-500 mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Appel à l'action */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-[36px] bg-emerald-600 text-white px-10 py-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
            <span className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-extrabold">Prêt à payer en ligne ?</h2>
              <p className="text-emerald-50/90 mt-2 text-lg">Créez votre compte et votre première carte en quelques minutes.</p>
            </div>
            <Link
              to="/register"
              className="relative h-14 px-8 rounded-2xl bg-white text-emerald-800 font-bold flex items-center gap-2 hover:bg-emerald-50 transition shrink-0"
            >
              Créer mon compte <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size="text-lg" />
            <span>· un service de Kodalink, Burkina Faso</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-emerald-700">Connexion</Link>
            <Link to="/register" className="hover:text-emerald-700">Inscription</Link>
          </div>
          <span>© {new Date().getFullYear()} Kodalink</span>
        </div>
      </footer>
    </div>
  );
}
