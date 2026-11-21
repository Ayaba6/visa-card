# Kodapay — cartes virtuelles

Application web mobile (React + Vite + Tailwind + Supabase) pour créer des cartes Visa / Mastercard
virtuelles en USD, rechargées depuis un solde FCFA alimenté par Mobile Money.

## Installation

1. **Base de données** : dans Supabase → *SQL Editor*, collez et exécutez `supabase/schema.sql`.
   ⚠️ Ce script supprime les anciennes tables (`profiles`, `virtual_cards`, `transactions`, `notifications`).
2. **Clés** : `.env.local` doit contenir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. **Auth** : dans Supabase → *Authentication → URL Configuration*, ajoutez `http://localhost:5173`
   aux *Redirect URLs* (liens de confirmation et de mot de passe oublié).
4. `npm install` puis `npm run dev`.

## Fonctionnalités

- Inscription / connexion / mot de passe oublié, code PIN à 4 chiffres (verrouillage auto après 10 min)
- Solde FCFA : dépôt et retrait Mobile Money (Orange, Moov, Wave), transfert entre utilisateurs Kodapay
- Cartes virtuelles : création, recharge, retrait vers le solde, gel / dégel, suppression avec remboursement,
  affichage sécurisé du numéro et du CVV (PIN requis)
- Historique filtrable, détail de chaque opération, notifications

## Sécurité

Le navigateur ne peut que **lire** ses propres données. Toutes les opérations d'argent passent par des
fonctions SQL (`security definer`) qui vérifient le PIN (haché bcrypt, blocage après 5 essais) et les soldes
dans une seule transaction. Le numéro complet et le CVV sont dans une table inaccessible depuis le navigateur.

## Mode démo

`app_settings.simulation_mode = true` : les dépôts Mobile Money et les achats par carte sont **simulés**.
Avant une vraie mise en production il faut :

- brancher un agrégateur Mobile Money (webhook → Edge Function avec la clé `service_role`) puis passer
  `simulation_mode` à `false` ;
- brancher un émetteur de cartes réel (API d'émission de cartes virtuelles) à la place de la génération locale.

Taux, frais et plafonds se règlent dans la table `app_settings`.
