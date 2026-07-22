import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

// Pages d'Authentification
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import PinScreen from './pages/PinScreen';

// Pages Principales
import Dashboard from './pages/Dashboard';
import CardsScreen from './pages/CardsScreen';
import CardDetailScreen from './pages/CardDetailScreen';
import NotificationsScreen from './pages/NotificationsScreen';
import SettingsScreen from './pages/SettingsScreen';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Récupérer la session Supabase active au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements d'état (Connexion, Déconnexion, Expire)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Écran de chargement pendant la vérification initiale
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const isAuthenticated = !!session;

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex justify-center items-center p-0 md:p-4">
        <div className="w-full max-w-md bg-white min-h-screen md:min-h-[844px] md:max-h-[844px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border border-slate-800">
          <Routes>
            {/* Redirection initiale */}
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/welcome"} replace />} 
            />

            {/* Écran de bienvenue */}
            <Route 
              path="/welcome" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <WelcomeScreen />
              } 
            />

            {/* Connexion classique */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />
              } 
            />

            {/* Inscription */}
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterScreen />
              } 
            />

            {/* Connexion rapide par PIN */}
            <Route 
              path="/pin" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <PinScreen />
              } 
            />

            {/* Routes Protégées */}
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/cards" 
              element={isAuthenticated ? <CardsScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/card-detail" 
              element={isAuthenticated ? <CardDetailScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/notifications" 
              element={isAuthenticated ? <NotificationsScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={isAuthenticated ? <SettingsScreen onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />

            {/* Redirection par défaut */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/welcome"} replace />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}