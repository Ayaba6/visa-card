import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PinPromptProvider, ToastProvider } from './context/Overlays';
import AppShell from './components/AppShell';
import { FullScreenLoader } from './components/ui';
import { isConfigured } from './lib/supabase';

import Welcome from './pages/auth/Welcome';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetupPin from './pages/auth/SetupPin';
import Lock from './pages/auth/Lock';
import SetupError from './pages/auth/SetupError';

import Home from './pages/Home';
import Cards from './pages/cards/Cards';
import CreateCard from './pages/cards/CreateCard';
import CardDetail from './pages/cards/CardDetail';
import Deposit from './pages/wallet/Deposit';
import Withdraw from './pages/wallet/Withdraw';
import Transfer from './pages/wallet/Transfer';
import Transactions from './pages/Transactions';
import Notifications from './pages/Notifications';
import Settings from './pages/account/Settings';
import Profile from './pages/account/Profile';
import ChangePin from './pages/account/ChangePin';

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="h-[100dvh] w-full flex justify-center md:items-center md:bg-gradient-to-br md:from-slate-200 md:to-emerald-100">
          {/* Cadre « téléphone » : plein écran sur mobile, centré sur ordinateur */}
          <div className="relative w-full max-w-[430px] h-full md:h-[min(880px,94dvh)] bg-slate-50 flex flex-col overflow-hidden md:rounded-[40px] md:shadow-2xl md:ring-8 md:ring-slate-900">
            <ToastProvider>
              <PinPromptProvider>
                <AppRoutes />
              </PinPromptProvider>
            </ToastProvider>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
