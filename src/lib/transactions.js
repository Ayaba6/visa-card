import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Download,
  CreditCard,
  ShoppingBag,
  Wallet,
  Trash2,
} from 'lucide-react';
import { fcfa, usd } from './format';

const META = {
  DEPOSIT: { label: 'Dépôt', icon: Download, tone: 'credit' },
  WITHDRAWAL: { label: 'Retrait', icon: ArrowUpRight, tone: 'debit' },
  TRANSFER_IN: { label: 'Argent reçu', icon: ArrowDownLeft, tone: 'credit' },
  TRANSFER_OUT: { label: 'Transfert envoyé', icon: Send, tone: 'debit' },
  CARD_CREATION: { label: 'Création de carte', icon: CreditCard, tone: 'debit' },
  CARD_FUNDING: { label: 'Recharge carte', icon: CreditCard, tone: 'debit' },
  CARD_UNLOAD: { label: 'Retrait de carte', icon: Wallet, tone: 'credit' },
  CARD_PAYMENT: { label: 'Paiement carte', icon: ShoppingBag, tone: 'debit' },
  CARD_TERMINATION: { label: 'Carte supprimée', icon: Trash2, tone: 'neutral' },
};

/**
 * Décrit une transaction pour l'affichage.
 * `context` = 'wallet' (montants en FCFA vus du solde) ou 'card' (montants en USD vus de la carte).
 */
export function describeTx(tx, context = 'wallet') {
  const meta = META[tx.type] || { label: tx.type, icon: Wallet, tone: 'neutral' };
  let title = meta.label;
  if (tx.type === 'TRANSFER_IN' && tx.counterparty_name) title = `De ${tx.counterparty_name}`;
  if (tx.type === 'TRANSFER_OUT' && tx.counterparty_name) title = `À ${tx.counterparty_name}`;
  if (tx.type === 'CARD_PAYMENT' && tx.counterparty_name) title = tx.counterparty_name;
  if ((tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL') && tx.operator) title = `${meta.label} ${tx.operator}`;

  const failed = tx.status === 'FAILED';
  let sign = '';
  let amount;
  let tone = meta.tone;

  if (context === 'card') {
    // Vu depuis la carte : la recharge est un crédit, le retrait / paiement un débit.
    const cardCredit = tx.type === 'CARD_FUNDING' || tx.type === 'CARD_CREATION';
    tone = cardCredit ? 'credit' : tx.type === 'CARD_TERMINATION' ? 'neutral' : 'debit';
    sign = tone === 'credit' ? '+' : tone === 'debit' ? '-' : '';
    amount = usd(tx.amount_usd);
  } else if (tx.type === 'CARD_PAYMENT') {
    sign = '-';
    amount = usd(tx.amount_usd);
  } else {
    const total = Number(tx.amount_fcfa) + (tx.direction === 'DEBIT' ? Number(tx.fee_fcfa || 0) : 0);
    sign = tx.direction === 'CREDIT' ? '+' : tx.direction === 'DEBIT' ? '-' : '';
    amount = fcfa(total);
  }

  if (failed) {
    tone = 'failed';
    sign = '';
  }

  return { ...meta, title, sign, amount, tone, failed };
}

export const TX_FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'in', label: 'Entrées' },
  { key: 'out', label: 'Sorties' },
  { key: 'cards', label: 'Cartes' },
];

export function filterTx(list, key) {
  if (key === 'in') return list.filter((t) => t.direction === 'CREDIT');
  if (key === 'out') return list.filter((t) => t.direction === 'DEBIT');
  if (key === 'cards') return list.filter((t) => t.type.startsWith('CARD_'));
  return list;
}
