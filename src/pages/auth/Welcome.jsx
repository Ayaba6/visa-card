import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, Globe2, Download } from 'lucide-react';
import { Button } from '../../components/ui';
import CardVisual from '../../components/CardVisual';
import InstallSheet from '../../components/InstallSheet';
import { useInstallPrompt } from '../../lib/pwa';
import { Logo } from './AuthLayout';

const DEMO_CARDS = [
  { label: 'Shopping', brand: 'VISA', holder_name: 'AWA OUEDRAOGO', last4: '4821', balance_usd: 124.5, color: 'violet', expiry_month: 9, expiry_year: 2029 },
  { label: 'Abonnements', brand: 'MASTERCARD', holder_name: 'AWA OUEDRAOGO', last4: '7730', balance_usd: 38, color: 'emerald', expiry_month: 3, expiry_year: 2028 },
];

const FEATURES = [
  { icon: Globe2, text: 'Payez sur Netflix, Amazon, AliExpress, Google…' },
  { icon: Smartphone, text: 'Rechargez par Orange Money, Moov Money ou Wave' },
  { icon: ShieldCheck, text: 'Gelez ou supprimez une carte en un geste' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { installed, canPrompt, ios } = useInstallPrompt();
  const [installOpen, setInstallOpen] = useState(false);
  return (
    <div className="flex-1 overflow-y-auto bg-emerald-950 text-white">
      <div className="min-h-full flex flex-col px-6 pt-8 pb-8">
        <Logo light />

        <div className="relative h-[230px] mt-8">
          <div className="absolute inset-x-6 top-0 rotate-[-7deg] opacity-90">
            <CardVisual card={DEMO_CARDS[0]} />
          </div>
          <div className="absolute inset-x-0 top-14 rotate-[3deg]">
            <CardVisual card={DEMO_CARDS[1]} />
          </div>
        </div>

        <h1 className="text-[30px] leading-[1.1] font-extrabold mt-10">
          Votre carte Visa virtuelle, <span className="text-emerald-300">en 1 minute.</span>
        </h1>
        <ul className="mt-5 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-emerald-50/90">
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-emerald-300" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8 space-y-3">
          <Button className="w-full !bg-emerald-400 !text-emerald-950 hover:!bg-emerald-300" onClick={() => navigate('/register')}>
            Créer un compte gratuit
          </Button>
          <Button variant="ghost" className="w-full !text-white hover:!bg-white/10" onClick={() => navigate('/login')}>
            J'ai déjà un compte
          </Button>
          {!installed && (canPrompt || ios) && (
            <button
              onClick={() => setInstallOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 pt-1"
            >
              <Download className="w-4 h-4" /> Installer l'application
            </button>
          )}
        </div>
      </div>
      <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
}
