/** Règles de validation partagées (inscription, profil). Fonctions pures, testées dans validation.test.js. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L} '.-]*$/u;

export const isValidEmail = (v) => EMAIL_RE.test((v || '').trim());

/** Prénom ou nom : au moins 2 caractères, lettres (accents compris), espaces, apostrophes, tirets. */
export const isValidName = (v) => {
  const t = (v || '').trim();
  return t.length >= 2 && NAME_RE.test(t);
};

export const PASSWORD_RULES = [
  { key: 'length', label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Un chiffre', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Score de 0 à 4 : nombre de règles respectées. */
export const passwordScore = (p) => (p ? PASSWORD_RULES.filter((r) => r.test(p)).length : 0);

/** Mot de passe accepté : 8 caractères minimum et au moins 3 règles sur 4. */
export const isStrongPassword = (p) => (p || '').length >= 8 && passwordScore(p) >= 3;
