import { DatabaseZap } from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

/** Affiché quand Supabase n'est pas configuré ou que le schéma n'a pas été installé. */
export default function SetupError({ message }) {
  const auth = useAuth();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <span className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <DatabaseZap className="w-8 h-8" />
      </span>
      <h1 className="text-xl font-extrabold text-slate-900 mt-5">Configuration incomplète</h1>
      <p className="text-sm text-slate-500 mt-2">
        {message || 'Impossible de charger votre profil.'}
      </p>
      <p className="text-sm text-slate-500 mt-3">
        Exécutez le fichier <code className="font-mono text-slate-800">supabase/schema.sql</code> dans l’éditeur SQL
        de Supabase, puis réessayez.
      </p>
      {auth?.session && (
        <div className="w-full space-y-2 mt-8">
          <Button className="w-full" onClick={() => auth.refreshProfile()}>
            Réessayer
          </Button>
          <Button variant="ghost" className="w-full" onClick={auth.signOut}>
            Se déconnecter
          </Button>
        </div>
      )}
    </div>
  );
}
