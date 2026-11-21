import { supabase } from './supabase';

const ERROR_MAP = [
  [/Invalid login credentials/i, 'Email ou mot de passe incorrect'],
  [/Email not confirmed/i, 'Confirmez votre email avant de vous connecter (vérifiez votre boîte mail)'],
  [/User already registered/i, 'Un compte existe déjà avec cet email'],
  [/Database error saving new user/i, 'Inscription impossible : ce numéro est peut-être déjà utilisé'],
  [/Password should be at least/i, 'Le mot de passe doit contenir au moins 6 caractères'],
  [/rate limit/i, 'Trop de tentatives, patientez quelques minutes'],
  [/Failed to fetch|NetworkError/i, 'Connexion impossible. Vérifiez votre connexion internet'],
  [/Could not find the function/i, "Le serveur n'est pas à jour : exécutez supabase/schema.sql"],
  [/relation .* does not exist/i, "Le serveur n'est pas à jour : exécutez supabase/schema.sql"],
];

export function humanError(err) {
  const msg = err?.message || String(err || 'Erreur inconnue');
  for (const [re, text] of ERROR_MAP) if (re.test(msg)) return text;
  return msg;
}

async function rpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new Error(humanError(error));
  if (data && typeof data === 'object' && data.error) throw new Error(data.error);
  return data;
}

async function select(query) {
  const { data, error } = await query;
  if (error) throw new Error(humanError(error));
  return data;
}

export const api = {
  // Lecture
  settings: () => select(supabase.from('app_settings').select('*').eq('id', 1).single()),
  profile: (id) => select(supabase.from('profiles').select('*').eq('id', id).maybeSingle()),
  cards: () =>
    select(supabase.from('cards').select('*').neq('status', 'TERMINATED').order('created_at', { ascending: false })),
  card: (id) => select(supabase.from('cards').select('*').eq('id', id).maybeSingle()),
  transactions: ({ cardId, limit = 30, before } = {}) => {
    let q = supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(limit);
    if (cardId) q = q.eq('card_id', cardId);
    if (before) q = q.lt('created_at', before);
    return select(q);
  },
  notifications: () =>
    select(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)),
  unreadCount: async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);
    if (error) return 0;
    return count || 0;
  },

  // PIN & profil
  setPin: (pin, current) => rpc('set_pin', { p_new: pin, p_current: current ?? null }),
  verifyPin: (pin) => rpc('verify_pin', { p_pin: pin }),
  resetPinAfterLogin: () => rpc('reset_pin_after_login'),
  updateProfile: (fullName, phone) => rpc('update_profile', { p_full_name: fullName, p_phone: phone }),
  markNotificationsRead: () => rpc('mark_notifications_read'),

  // Portefeuille
  deposit: (amount, operator, phone) =>
    rpc('wallet_deposit', { p_amount: Math.round(amount), p_operator: operator, p_phone: phone }),
  withdraw: (amount, operator, phone, pin) =>
    rpc('wallet_withdraw', { p_amount: Math.round(amount), p_operator: operator, p_phone: phone, p_pin: pin }),
  lookupRecipient: (phone) => rpc('lookup_recipient', { p_phone: phone }),
  transfer: (phone, amount, note, pin) =>
    rpc('wallet_transfer', { p_phone: phone, p_amount: Math.round(amount), p_note: note, p_pin: pin }),

  // Cartes
  createCard: ({ brand, label, holder, initialFcfa, color }, pin) =>
    rpc('create_virtual_card', {
      p_brand: brand,
      p_label: label,
      p_holder: holder,
      p_initial_fcfa: Math.round(initialFcfa),
      p_color: color,
      p_pin: pin,
    }),
  fundCard: (cardId, amountFcfa, pin) =>
    rpc('card_fund', { p_card_id: cardId, p_amount_fcfa: Math.round(amountFcfa), p_pin: pin }),
  unloadCard: (cardId, amountUsd, pin) =>
    rpc('card_unload', { p_card_id: cardId, p_amount_usd: amountUsd, p_pin: pin }),
  setCardFrozen: (cardId, frozen, pin) =>
    rpc('card_set_frozen', { p_card_id: cardId, p_frozen: frozen, p_pin: pin ?? null }),
  terminateCard: (cardId, pin) => rpc('card_terminate', { p_card_id: cardId, p_pin: pin }),
  revealCard: (cardId, pin) => rpc('reveal_card', { p_card_id: cardId, p_pin: pin }),
  simulatePayment: (cardId, merchant, amountUsd) =>
    rpc('simulate_card_payment', { p_card_id: cardId, p_merchant: merchant, p_amount_usd: amountUsd }),
};
