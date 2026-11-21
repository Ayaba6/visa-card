import { describe, expect, it } from 'vitest';
import { isStrongPassword, isValidEmail, isValidName, passwordScore } from './validation';

describe('email', () => {
  it('accepte les adresses valides', () => {
    expect(isValidEmail('awa@kodalink.com')).toBe(true);
    expect(isValidEmail('  awa.o+test@mail.bf ')).toBe(true);
  });
  it('refuse les adresses invalides', () => {
    expect(isValidEmail('awa@')).toBe(false);
    expect(isValidEmail('awa@mail')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('nom', () => {
  it('accepte accents, tirets et apostrophes', () => {
    expect(isValidName('Ouédraogo')).toBe(true);
    expect(isValidName("N'Diaye")).toBe(true);
    expect(isValidName('Marie-Claire')).toBe(true);
  });
  it('refuse les noms trop courts ou avec chiffres', () => {
    expect(isValidName('A')).toBe(false);
    expect(isValidName('Awa2')).toBe(false);
    expect(isValidName('-Awa')).toBe(false);
  });
});

describe('mot de passe', () => {
  it('calcule un score de 0 à 4', () => {
    expect(passwordScore('')).toBe(0);
    expect(passwordScore('abc')).toBe(0);
    expect(passwordScore('abcdefgh')).toBe(1);
    expect(passwordScore('Abcdefgh')).toBe(2);
    expect(passwordScore('Abcdefg1')).toBe(3);
    expect(passwordScore('Abcdef1!')).toBe(4);
  });

  it('exige 8 caractères et 3 règles sur 4', () => {
    expect(isStrongPassword('Abcdefg1')).toBe(true);
    expect(isStrongPassword('Ab1!')).toBe(false);
    expect(isStrongPassword('abcdefgh1')).toBe(false);
  });
});
