const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const fcfa = (n) => `${nf.format(Math.round(Number(n) || 0))} FCFA`;

export const usd = (n) =>
  `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const time = (d) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const fullDate = (d) =>
  new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export function dayLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const firstName = (name) => (name || '').trim().split(/\s+/)[0] || '';

export const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

export const groupPan = (pan) => (pan || '').replace(/(.{4})/g, '$1 ').trim();

/** Normalise un numéro burkinabè : 8 chiffres -> +226XXXXXXXX */
export function normalizePhone(p) {
  let v = (p || '').replace(/\D/g, '');
  if (v.startsWith('00')) v = v.slice(2);
  if (!v) return '';
  if (v.length === 8) return `+226${v}`;
  return `+${v}`;
}

export const digitsOnly = (v) => (v || '').replace(/\D/g, '');

/** « 70123456 » -> « 70 12 34 56 » (affichage d'un numéro local à 8 chiffres). */
export const formatLocalPhone = (digits) => digitsOnly(digits).replace(/(\d{2})(?=\d)/g, '$1 ');

/** Les 8 derniers chiffres d'un numéro stocké en « +226XXXXXXXX ». */
export const localPhone = (phone) => digitsOnly(phone).slice(-8);
