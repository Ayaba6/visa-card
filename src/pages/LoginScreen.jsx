import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function LoginScreen({ onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        onSuccess();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 flex flex-col justify-between p-6 relative">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
        <h1 className="text-2xl font-bold text-emerald-950 text-center mb-8">
          Connexion
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* CHAMP EMAIL */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 transition-colors">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-emerald-600" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full text-sm py-1 outline-none text-slate-800 placeholder-slate-300 bg-transparent"
            />
          </div>

          {/* CHAMP MOT DE PASSE */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 relative transition-colors">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-600" /> Mot de passe
            </label>
            <div className="flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm py-1 outline-none text-slate-800 placeholder-slate-300 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 p-1 hover:text-emerald-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-left">
            <button 
              type="button" 
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* BOUTON SE CONNECTER */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full shadow-lg shadow-emerald-600/20 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
          </button>
        </form>

        {/* LIEN INSCRIPTION */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Vous n'avez pas de compte ?{' '}
          <button
            onClick={() => navigate('/register')}
            className="block w-full mt-2 font-bold text-emerald-800 text-sm hover:underline"
          >
            Inscription
          </button>
        </div>
      </div>
    </div>
  );
}