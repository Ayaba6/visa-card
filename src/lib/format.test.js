import { describe, expect, it } from 'vitest';
import { digitsOnly, fcfa, firstName, formatLocalPhone, groupPan, initials, localPhone, normalizePhone, usd } from './format';

// Intl insère des espaces insécables : on les normalise pour comparer.
const plain = (s) => s.replace(/[  ]/g, ' ');

describe('montants', () => {
  it('formate les FCFA sans décimales, arrondis', () => {
    expect(plain(fcfa(1500000))).toBe('1 500 000 FCFA');
    expect(plain(fcfa(999.6))).toBe('1 000 FCFA');
    expect(fcfa(null)).toBe('0 FCFA');
  });

  it('formate les dollars avec deux décimales', () => {
    expect(usd(4.6)).toBe('$4.60');
    expect(usd('1234.5')).toBe('$1,234.50');
    expect(usd(undefined)).toBe('$0.00');
  });
});

describe('téléphone', () => {
  it('normalise un numéro burkinabè à 8 chiffres', () => {
    expect(normalizePhone('70 12 34 56')).toBe('+22670123456');
    expect(normalizePhone('0022670123456')).toBe('+22670123456');
    expect(normalizePhone('+226 70123456')).toBe('+22670123456');
    expect(normalizePhone('')).toBe('');
  });

  it('formate et extrait le numéro local', () => {
    expect(formatLocalPhone('70123456')).toBe('70 12 34 56');
    expect(formatLocalPhone('701')).toBe('70 1');
    expect(localPhone('+22670123456')).toBe('70123456');
    expect(localPhone(null)).toBe('');
    expect(digitsOnly('a1-2 3')).toBe('123');
  });
});

describe('noms et cartes', () => {
  it('extrait prénom et initiales', () => {
    expect(firstName('  Awa  Ouédraogo ')).toBe('Awa');
    expect(initials('awa ouédraogo')).toBe('AO');
    expect(initials('')).toBe('?');
  });

  it('groupe le numéro de carte par 4', () => {
    expect(groupPan('4111111111111111')).toBe('4111 1111 1111 1111');
  });
});
