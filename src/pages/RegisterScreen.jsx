import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Inscription Auth Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });

      if (authError) throw authError;

      // 2. Création du profil dans la table 'profiles'
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            phone: `+226${phone}`,
            balance_fcfa: 0,
          },
        ]);
        if (profileError) console.error("Erreur profil:", profileError.message);
      }

      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 flex flex-col justify-between p-6 relative">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full my-6">
        <h1 className="text-2xl font-bold text-emerald-950 text-center mb-6">
          Inscription
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* NOM COMPLET */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 transition-colors">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-emerald-600" /> Nom complet ou Nom de l'entreprise
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: John Doe"
              className="w-full text-sm py-1 outline-none text-slate-800 placeholder-slate-300 bg-transparent"
            />
          </div>

          {/* EMAIL */}
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

          {/* WHATSAPP */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 transition-colors">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-emerald-600" /> Numéro Whatsapp
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                🇧🇫 +226
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0101010101"
                className="w-full text-sm py-1 outline-none text-slate-800 placeholder-slate-300 bg-transparent"
              />
            </div>
          </div>

          {/* MOT DE PASSE */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 transition-colors">
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

          {/* CONFIRMER MOT DE PASSE */}
          <div className="border-b border-emerald-200 focus-within:border-emerald-600 pb-1 transition-colors">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-600" /> Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm py-1 outline-none text-slate-800 placeholder-slate-300 bg-transparent"
            />
          </div>

          {/* CHECKBOX CONDITIONS */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs font-medium text-emerald-950 cursor-pointer">
              J'accepte les conditions d'utilisation
            </label>
          </div>

          {/* BOUTON SOUMETTRE */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full shadow-lg shadow-emerald-600/20 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer mon compte'}
          </button>
        </form>

        {/* LIEN CONNEXION */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Vous avez déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="block w-full mt-2 font-bold text-emerald-800 text-sm hover:underline"
          >
            Connexion
          </button>
        </div>
      </div>
    </div>
  );
}