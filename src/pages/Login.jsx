import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login({ onNavigate, onLoginSuccess }) {
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
      if (data.user) onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 relative">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
        <h1 className="text-2xl font-bold text-blue-950 text-center mb-8">
          Connexion
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* CHAMP EMAIL */}
          <div className="border-b border-slate-300 pb-1">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-slate-400" /> Email
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
          <div className="border-b border-slate-300 pb-1 relative">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-slate-400" /> Mot de passe
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
                className="text-slate-400 p-1 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-left">
            <button
              type="button"
              className="text-xs font-semibold text-blue-950 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-950 hover:bg-blue-900 text-white font-semibold py-3.5 rounded-full shadow-md flex items-center justify-center transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Vous n'avez pas de compte ?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="block w-full mt-2 font-bold text-blue-950 text-sm hover:underline"
          >
            Inscription
          </button>
        </div>
      </div>
    </div>
  );
}