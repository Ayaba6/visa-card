import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './contexts';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';


const UNLOCK_KEY = 'kp_unlocked_until';
const UNLOCK_DURATION = 10 * 60 * 1000; // l'app se reverrouille après 10 min d'inactivité

function readUnlocked() {
  try {
    return Number(sessionStorage.getItem(UNLOCK_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

function writeUnlocked(value) {
  try {
    if (value) sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_DURATION));
    else sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* stockage indisponible : on reste en mémoire */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [unlocked, setUnlockedState] = useState(readUnlocked);

  const userId = session?.user?.id;

  const setUnlocked = useCallback((value) => {
    writeUnlocked(value);
    setUnlockedState(value);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return null;
    try {
      const p = await api.profile(userId);
      setProfile(p);
      setProfileError(p ? null : 'Profil introuvable');
      return p;
    } catch (err) {
      setProfileError(err.message);
      return null;
    }
  }, [userId]);

  // Session Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setUnlocked(false);
        setRecovery(false);
      }
      setSession(s);
      if (!s) setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [setUnlocked]);

  // Profil + paramètres à chaque changement d'utilisateur
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([refreshProfile(), api.settings().catch(() => null)]).then(([, s]) => {
      if (cancelled) return;
      setSettings(s);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshProfile]);

  // Prolonge le déverrouillage tant que l'utilisateur est actif
  useEffect(() => {
    if (!unlocked) return;
    const extend = () => writeUnlocked(true);
    const check = setInterval(() => {
      if (!readUnlocked()) setUnlockedState(false);
    }, 15000);
    window.addEventListener('pointerdown', extend);
    window.addEventListener('keydown', extend);
    return () => {
      clearInterval(check);
      window.removeEventListener('pointerdown', extend);
      window.removeEventListener('keydown', extend);
    };
  }, [unlocked]);

  const signOut = useCallback(async () => {
    setUnlocked(false);
    await supabase.auth.signOut();
  }, [setUnlocked]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      settings,
      loading,
      profileError,
      recovery,
      setRecovery,
      unlocked,
      setUnlocked,
      refreshProfile,
      signOut,
    }),
    [session, profile, settings, loading, profileError, recovery, unlocked, setUnlocked, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
