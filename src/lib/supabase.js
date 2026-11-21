import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  console.error('Clés Supabase manquantes : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local');
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'missing-key');
