import { describe, expect, it } from 'vitest';
import { describeTx, filterTx } from './transactions';

const plain = (s) => s.replace(/[  ]/g, ' ');

const tx = (over) => ({
  id: Math.random().toString(36),
  type: 'DEPOSIT',
  direction: 'CREDIT',
  amount_fcfa: 5000,
  amount_usd: null,
  fee_fcfa: 0,
  status: 'SUCCESS',
  created_at: '2026-11-07T20:06:00Z',
  ...over,
});

describe('describeTx — vue solde', () => {
  it('affiche un dépôt en crédit avec l’opérateur', () => {
    const d = describeTx(tx({ operator: 'Orange Money' }));
    expect(d.title).toBe('Dépôt Orange Money');
    expect(d.sign).toBe('+');
    expect(plain(d.amount)).toBe('5 000 FCFA');
    expect(d.tone).toBe('credit');
  });

  it('inclut les frais dans le montant débité', () => {
    const d = describeTx(tx({ type: 'WITHDRAWAL', direction: 'DEBIT', amount_fcfa: 10000, fee_fcfa: 150 }));
    expect(d.sign).toBe('-');
    expect(plain(d.amount)).toBe('10 150 FCFA');
  });

  it('nomme l’expéditeur d’un transfert reçu', () => {
    expect(describeTx(tx({ type: 'TRANSFER_IN', counterparty_name: 'Awa O.' })).title).toBe('De Awa O.');
  });

  it('affiche les paiements par carte en dollars', () => {
    const d = describeTx(tx({ type: 'CARD_PAYMENT', direction: 'DEBIT', amount_fcfa: 0, amount_usd: 2.5, counterparty_name: 'Spotify' }));
    expect(d.title).toBe('Spotify');
    expect(d.amount).toBe('$2.50');
  });

  it('marque les opérations échouées sans signe', () => {
    const d = describeTx(tx({ type: 'CARD_PAYMENT', direction: 'NONE', amount_usd: 9.99, status: 'FAILED' }));
    expect(d.failed).toBe(true);
    expect(d.sign).toBe('');
    expect(d.tone).toBe('failed');
  });
});

describe('describeTx — vue carte', () => {
  it('présente une recharge comme un crédit de la carte', () => {
    const d = describeTx(tx({ type: 'CARD_FUNDING', direction: 'DEBIT', amount_usd: 7.69 }), 'card');
    expect(d.sign).toBe('+');
    expect(d.amount).toBe('$7.69');
  });

  it('présente un retrait de carte comme un débit de la carte', () => {
    const d = describeTx(tx({ type: 'CARD_UNLOAD', direction: 'CREDIT', amount_usd: 3 }), 'card');
    expect(d.sign).toBe('-');
  });
});

describe('filterTx', () => {
  const list = [
    tx({ type: 'DEPOSIT', direction: 'CREDIT' }),
    tx({ type: 'WITHDRAWAL', direction: 'DEBIT' }),
    tx({ type: 'CARD_PAYMENT', direction: 'DEBIT' }),
    tx({ type: 'CARD_TERMINATION', direction: 'NONE' }),
  ];

  it('filtre par sens et par type', () => {
    expect(filterTx(list, 'all')).toHaveLength(4);
    expect(filterTx(list, 'in')).toHaveLength(1);
    expect(filterTx(list, 'out')).toHaveLength(2);
    expect(filterTx(list, 'cards')).toHaveLength(2);
  });
});
