import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PinPromptProvider, ToastProvider } from './context/Overlays';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import { FullScreenLoader } from './components/ui';
import { isConfigured } from './lib/supabase';
import { useOnline } from './lib/pwa';
import { WifiOff } from 'lucide-react';

// Écrans d'entrée : chargés immédiatement (premier affichage le plus rapide possible)
import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import Lock from './pages/auth/Lock';
import SetupError from './pages/auth/SetupError';

// Tous les autres écrans : chargés à la demande, chacun dans son propre fichier
const Landing = lazy(() => import('./pages/Landing'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const SetupPin = lazy(() => import('./pages/auth/SetupPin'));
const Home = lazy(() => import('./pages/Home'));
const Cards = lazy(() => import('./pages/cards/Cards'));
const CreateCard = lazy(() => import('./pages/cards/CreateCard'));
const CardDetail = lazy(() => import('./pages/cards/CardDetail'));
const Deposit = lazy(() => import('./pages/wallet/Deposit'));
const Withdraw = lazy(() => import('./pages/wallet/Withdraw'));
const Transfer = lazy(() => import('./pages/wallet/Transfer'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/account/Settings'));
const Profile = lazy(() => import('./pages/account/Profile'));
const ChangePin = lazy(() => import('./pages/account/ChangePin'));

function AppRoutes() {
  const { session, profile, profileError, loading, recovery, unlocked } = useAuth();

  if (!isConfigured) {
    return <SetupError message="Les clés Supabase sont absentes du fichier .env.local." />;
  }
  if (loading) return <FullScreenLoader />;

  if (!session) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  if (recovery) return <ResetPassword />;
  if (!profile) return <SetupError message={profileError} />;
  if (!profile.has_pin) return <SetupPin />;
  if (!unlocked) return <Lock />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/cards/new" element={<CreateCard />} />
      <Route path="/cards/:id" element={<CardDetail />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/transfer" element={<Transfer />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/security/pin" element={<ChangePin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const DESKTOP_QUERY = '(min-width: 1024px)';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

function Root() {
  const { session, loading } = useAuth();
  const isDesktop = useIsDesktop();
  const online = useOnline();

  // Visiteur non connecté sur ordinateur : présentation et formulaires en pleine largeur
  if (isConfigured && !loading && !session && isDesktop) {
    return (
      <div className="relative h-[100dvh] flex flex-col">
        <ToastProvider>
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex justify-center md:items-center md:bg-gradient-to-br md:from-slate-200 md:to-emerald-100">
      {/* Cadre « téléphone » : plein écran sur mobile, centré sur ordinateur */}
      <div className="relative w-full max-w-[430px] h-full md:h-[min(880px,94dvh)] bg-slate-50 flex flex-col overflow-hidden md:rounded-[40px] md:shadow-2xl md:ring-8 md:ring-slate-900">
        {!online && (
          <div role="status" className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-medium py-2 px-4">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            Vous êtes hors ligne. Les soldes et opérations se mettront à jour au retour de la connexion.
          </div>
        )}
        <ToastProvider>
          <PinPromptProvider>
            <Suspense fallback={<FullScreenLoader />}>
              <AppRoutes />
            </Suspense>
          </PinPromptProvider>
        </ToastProvider>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
