import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/Overlays';
import { api } from '../../lib/api';
import { digitsOnly } from '../../lib/format';
import { Button, Field, Notice } from '../../components/ui';
import { FormPage } from '../wallet/shared';

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(digitsOnly(profile?.phone).slice(-8));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = fullName.trim().length >= 2 && phone.length === 8;

  const save = async () => {
    setLoading(true);
    setError('');
    try {
      await api.updateProfile(fullName, phone);
      await refreshProfile();
      toast.success('Profil mis à jour');
      navigate(-1);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <FormPage
      title="Informations personnelles"
      footer={
        <Button className="w-full" disabled={!valid} loading={loading} onClick={save}>
          Enregistrer
        </Button>
      }
    >
      <div className="space-y-4 pt-2">
        <Field label="Nom complet" icon={User} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field
          label="Numéro de téléphone"
          hint="Vos contacts Kodapay vous envoient de l'argent avec ce numéro."
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 8))}
          icon={() => <span className="text-sm font-semibold text-slate-500">🇧🇫 +226</span>}
        />
        <Field label="Email" icon={Mail} value={user?.email || ''} disabled hint="L'email de connexion ne peut pas être modifié ici." />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </FormPage>
  );
}
