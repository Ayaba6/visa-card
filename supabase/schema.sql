-- =====================================================================
--  KODAPAY — Schéma Supabase complet (v2)
-- ---------------------------------------------------------------------
--  À exécuter dans : Supabase > SQL Editor > New query > Run
--
--  ⚠️  ATTENTION : la section 0 SUPPRIME les anciennes tables
--  (profiles, virtual_cards, transactions, notifications) et leurs
--  données. Les comptes de connexion (auth.users) sont conservés et
--  reçoivent automatiquement un nouveau profil (section 9).
--
--  Principe de sécurité :
--   • Le navigateur ne peut QUE LIRE ses propres données (RLS).
--   • Toute opération d'argent passe par une fonction SQL
--     (security definer) qui vérifie le PIN, les soldes et écrit
--     tout en une seule transaction atomique.
--   • Le PIN est haché (bcrypt), le numéro complet et le CVV des
--     cartes sont dans une table illisible depuis le navigateur.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 0. Nettoyage de l'ancien schéma
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.virtual_cards  cascade;
drop table if exists public.transactions   cascade;
drop table if exists public.notifications  cascade;
drop table if exists public.card_secrets   cascade;
drop table if exists public.cards          cascade;
drop table if exists public.user_pins      cascade;
drop table if exists public.app_settings   cascade;
drop table if exists public.profiles       cascade;

-- ---------------------------------------------------------------------
-- 1. Paramètres de l'application (taux, frais, limites)
--    Modifiables à tout moment depuis Supabase > Table editor.
-- ---------------------------------------------------------------------
create table public.app_settings (
  id                      int primary key default 1 check (id = 1),
  usd_rate_fcfa           numeric not null default 650,   -- prix d'1 USD quand on recharge une carte
  usd_sell_rate_fcfa      numeric not null default 600,   -- valeur d'1 USD quand on retire d'une carte
  card_creation_fee_fcfa  bigint  not null default 1000,
  card_min_initial_fcfa   bigint  not null default 3000,
  card_min_fund_fcfa      bigint  not null default 1000,
  card_fund_fee_percent   numeric not null default 2,
  max_active_cards        int     not null default 5,
  min_deposit_fcfa        bigint  not null default 500,
  max_deposit_fcfa        bigint  not null default 2000000,
  min_withdraw_fcfa       bigint  not null default 1000,
  withdraw_fee_percent    numeric not null default 1.5,
  min_transfer_fcfa       bigint  not null default 100,
  transfer_fee_fcfa       bigint  not null default 0,
  -- true = mode démo : dépôts Mobile Money et paiements carte simulés.
  -- En production, mettez false et branchez un vrai agrégateur de paiement
  -- (webhook → Edge Function avec la clé service_role).
  simulation_mode         boolean not null default true
);
insert into public.app_settings default values;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  full_name     text not null default '',
  phone         text unique,
  balance_fcfa  bigint not null default 0 check (balance_fcfa >= 0),
  has_pin       boolean not null default false,
  kyc_status    text not null default 'UNVERIFIED'
                check (kyc_status in ('UNVERIFIED', 'PENDING', 'VERIFIED')),
  created_at    timestamptz not null default now()
);

create table public.user_pins (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  pin_hash      text not null,
  attempts      int not null default 0,
  locked_until  timestamptz,
  updated_at    timestamptz not null default now()
);

create table public.cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  label         text not null default 'Ma carte',
  brand         text not null check (brand in ('VISA', 'MASTERCARD')),
  holder_name   text not null,
  last4         text not null,
  expiry_month  int  not null,
  expiry_year   int  not null,
  balance_usd   numeric(12, 2) not null default 0 check (balance_usd >= 0),
  status        text not null default 'ACTIVE'
                check (status in ('ACTIVE', 'FROZEN', 'TERMINATED')),
  color         text not null default 'emerald',
  created_at    timestamptz not null default now()
);
create index cards_user_idx on public.cards (user_id, created_at desc);

create table public.card_secrets (
  card_id  uuid primary key references public.cards (id) on delete cascade,
  pan      text not null,
  cvv      text not null
);

create table public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  card_id            uuid references public.cards (id) on delete set null,
  type               text not null check (type in (
                       'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT',
                       'CARD_CREATION', 'CARD_FUNDING', 'CARD_UNLOAD',
                       'CARD_PAYMENT', 'CARD_TERMINATION')),
  direction          text not null check (direction in ('CREDIT', 'DEBIT', 'NONE')),
  amount_fcfa        bigint not null default 0,
  amount_usd         numeric(12, 2),
  fee_fcfa           bigint not null default 0,
  status             text not null default 'SUCCESS' check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  description        text,
  operator           text,
  phone              text,
  counterparty_name  text,
  reference          text not null default ('KP' || upper(substr(md5(gen_random_uuid()::text), 1, 10))),
  created_at         timestamptz not null default now()
);
create index transactions_user_idx on public.transactions (user_id, created_at desc);
create index transactions_card_idx on public.transactions (card_id, created_at desc);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  body        text not null default '',
  kind        text not null default 'INFO' check (kind in ('INFO', 'SUCCESS', 'WARNING')),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Sécurité : lecture seule de ses propres lignes
-- ---------------------------------------------------------------------
alter table public.app_settings  enable row level security;
alter table public.profiles      enable row level security;
alter table public.user_pins     enable row level security;
alter table public.cards         enable row level security;
alter table public.card_secrets  enable row level security;
alter table public.transactions  enable row level security;
alter table public.notifications enable row level security;

revoke all on public.app_settings, public.profiles, public.user_pins, public.cards,
              public.card_secrets, public.transactions, public.notifications
  from anon, authenticated;

grant select on public.app_settings to anon, authenticated;
grant select on public.profiles, public.cards, public.transactions, public.notifications to authenticated;
-- user_pins et card_secrets : aucun accès depuis le navigateur.

create policy "settings lisibles"      on public.app_settings  for select using (true);
create policy "mon profil"             on public.profiles      for select to authenticated using (id = auth.uid());
create policy "mes cartes"             on public.cards         for select to authenticated using (user_id = auth.uid());
create policy "mes transactions"       on public.transactions  for select to authenticated using (user_id = auth.uid());
create policy "mes notifications"      on public.notifications for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. Fonctions internes (non appelables depuis le navigateur)
-- ---------------------------------------------------------------------
create or replace function public._fmt(p bigint) returns text
language sql immutable as $$
  select replace(to_char(p, 'FM999G999G999G990'), ',', ' ')
$$;

create or replace function public._norm_phone(p text) returns text
language plpgsql immutable as $$
declare v text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if v like '00%' then v := substr(v, 3); end if;
  if length(v) = 0 then return null; end if;
  if length(v) = 8 then return '+226' || v; end if;   -- numéro burkinabè sans indicatif
  return '+' || v;
end $$;

create or replace function public._uid() returns uuid
language plpgsql stable as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'Session expirée, reconnectez-vous'; end if;
  return v;
end $$;

create or replace function public._notify(p_uid uuid, p_title text, p_body text, p_kind text default 'INFO')
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, kind) values (p_uid, p_title, p_body, p_kind);
$$;

-- Vérifie le PIN. Renvoie NULL si correct, sinon un message d'erreur.
-- (Ne lève pas d'exception pour que le compteur d'essais soit bien enregistré.)
create or replace function public._check_pin(p_uid uuid, p_pin text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare r public.user_pins;
begin
  select * into r from public.user_pins where user_id = p_uid for update;
  if not found then raise exception 'Aucun code PIN défini'; end if;

  if r.locked_until is not null and r.locked_until > now() then
    raise exception 'Trop de tentatives. Réessayez dans % min.',
      ceil(extract(epoch from (r.locked_until - now())) / 60)::int;
  end if;

  if r.pin_hash = crypt(coalesce(p_pin, ''), r.pin_hash) then
    update public.user_pins set attempts = 0, locked_until = null where user_id = p_uid;
    return null;
  end if;

  if r.attempts + 1 >= 5 then
    update public.user_pins set attempts = 0, locked_until = now() + interval '15 minutes' where user_id = p_uid;
    perform public._notify(p_uid, 'Code PIN bloqué',
      '5 codes PIN erronés ont été saisis. Les opérations sont bloquées pendant 15 minutes.', 'WARNING');
    return 'Code PIN incorrect. Trop de tentatives : bloqué pendant 15 minutes.';
  end if;

  update public.user_pins set attempts = r.attempts + 1 where user_id = p_uid;
  return format('Code PIN incorrect (%s essai(s) restant(s))', 5 - (r.attempts + 1));
end $$;

-- Génère un numéro de carte valide (algorithme de Luhn)
create or replace function public._gen_pan(p_brand text) returns text
language plpgsql volatile as $$
declare
  base  text := case when p_brand = 'VISA' then '4' else '5' || (1 + floor(random() * 5))::int::text end;
  total int := 0;
  d     int;
  dbl   boolean := true;
  i     int;
begin
  while length(base) < 15 loop
    base := base || floor(random() * 10)::int::text;
  end loop;
  for i in reverse 15..1 loop
    d := substr(base, i, 1)::int;
    if dbl then
      d := d * 2;
      if d > 9 then d := d - 9; end if;
    end if;
    total := total + d;
    dbl := not dbl;
  end loop;
  return base || ((10 - total % 10) % 10)::text;
end $$;

create or replace function public._my_card(p_uid uuid, p_card_id uuid) returns public.cards
language plpgsql security definer set search_path = public as $$
declare c public.cards;
begin
  select * into c from public.cards where id = p_card_id and user_id = p_uid for update;
  if not found then raise exception 'Carte introuvable'; end if;
  if c.status = 'TERMINATED' then raise exception 'Cette carte a été supprimée'; end if;
  return c;
end $$;

-- ---------------------------------------------------------------------
-- 5. Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    public._norm_phone(new.raw_user_meta_data ->> 'phone')
  );
  perform public._notify(new.id, 'Bienvenue sur Kodapay 🎉',
    'Votre compte est prêt. Rechargez votre solde puis créez votre première carte virtuelle.', 'SUCCESS');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 6. RPC : PIN et profil
-- ---------------------------------------------------------------------
create or replace function public.set_pin(p_new text, p_current text default null) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_uid uuid := public._uid(); v_err text;
begin
  if p_new !~ '^\d{4}$' then raise exception 'Le code PIN doit contenir exactement 4 chiffres'; end if;

  if exists (select 1 from public.user_pins where user_id = v_uid) then
    v_err := public._check_pin(v_uid, p_current);
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
    update public.user_pins
       set pin_hash = crypt(p_new, gen_salt('bf')), attempts = 0, locked_until = null, updated_at = now()
     where user_id = v_uid;
    perform public._notify(v_uid, 'Code PIN modifié', 'Votre code PIN a été changé avec succès.', 'INFO');
  else
    insert into public.user_pins (user_id, pin_hash) values (v_uid, crypt(p_new, gen_salt('bf')));
  end if;

  update public.profiles set has_pin = true where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.verify_pin(p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_err text := public._check_pin(public._uid(), p_pin);
begin
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  return jsonb_build_object('ok', true);
end $$;

-- PIN oublié : autorisé seulement juste après une connexion par mot de passe (< 5 min)
create or replace function public.reset_pin_after_login() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); v_ts bigint;
begin
  select max((e ->> 'timestamp')::bigint) into v_ts
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e
   where e ->> 'method' = 'password';

  if v_ts is null or v_ts < extract(epoch from now()) - 300 then
    raise exception 'Confirmez d''abord votre mot de passe';
  end if;

  delete from public.user_pins where user_id = v_uid;
  update public.profiles set has_pin = false where id = v_uid;
  perform public._notify(v_uid, 'Code PIN réinitialisé',
    'Votre code PIN a été réinitialisé. Si ce n''est pas vous, changez votre mot de passe.', 'WARNING');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.update_profile(p_full_name text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid();
begin
  if length(trim(coalesce(p_full_name, ''))) < 2 then raise exception 'Nom trop court'; end if;
  update public.profiles
     set full_name = trim(p_full_name), phone = public._norm_phone(p_phone)
   where id = v_uid;
  return jsonb_build_object('ok', true);
exception when unique_violation then
  raise exception 'Ce numéro est déjà utilisé par un autre compte';
end $$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read = true where user_id = auth.uid() and not read;
$$;

-- ---------------------------------------------------------------------
-- 7. RPC : portefeuille (dépôt, retrait, transfert)
-- ---------------------------------------------------------------------
create or replace function public.wallet_deposit(p_amount bigint, p_operator text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; v_tx uuid;
begin
  select * into s from public.app_settings where id = 1;
  if not s.simulation_mode then
    raise exception 'Les dépôts Mobile Money réels ne sont pas encore branchés';
  end if;
  if p_operator not in ('Orange Money', 'Moov Money', 'Wave') then raise exception 'Opérateur invalide'; end if;
  if public._norm_phone(p_phone) is null then raise exception 'Numéro de téléphone invalide'; end if;
  if p_amount is null or p_amount < s.min_deposit_fcfa then
    raise exception 'Montant minimum : % FCFA', public._fmt(s.min_deposit_fcfa);
  end if;
  if p_amount > s.max_deposit_fcfa then
    raise exception 'Montant maximum : % FCFA', public._fmt(s.max_deposit_fcfa);
  end if;

  update public.profiles set balance_fcfa = balance_fcfa + p_amount where id = v_uid;

  insert into public.transactions (user_id, type, direction, amount_fcfa, operator, phone, description)
  values (v_uid, 'DEPOSIT', 'CREDIT', p_amount, p_operator, public._norm_phone(p_phone), 'Dépôt ' || p_operator)
  returning id into v_tx;

  perform public._notify(v_uid, 'Dépôt reçu',
    format('%s FCFA ont été crédités sur votre solde via %s.', public._fmt(p_amount), p_operator), 'SUCCESS');
  return jsonb_build_object('transaction_id', v_tx);
end $$;

create or replace function public.wallet_withdraw(p_amount bigint, p_operator text, p_phone text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; v_fee bigint; v_err text; v_tx uuid;
begin
  select * into s from public.app_settings where id = 1;
  if p_operator not in ('Orange Money', 'Moov Money', 'Wave') then raise exception 'Opérateur invalide'; end if;
  if public._norm_phone(p_phone) is null then raise exception 'Numéro de téléphone invalide'; end if;
  if p_amount is null or p_amount < s.min_withdraw_fcfa then
    raise exception 'Montant minimum : % FCFA', public._fmt(s.min_withdraw_fcfa);
  end if;
  v_fee := ceil(p_amount * s.withdraw_fee_percent / 100);

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  update public.profiles set balance_fcfa = balance_fcfa - (p_amount + v_fee)
   where id = v_uid and balance_fcfa >= p_amount + v_fee;
  if not found then
    raise exception 'Solde insuffisant (% FCFA nécessaires, frais inclus)', public._fmt(p_amount + v_fee);
  end if;

  insert into public.transactions (user_id, type, direction, amount_fcfa, fee_fcfa, operator, phone, description)
  values (v_uid, 'WITHDRAWAL', 'DEBIT', p_amount, v_fee, p_operator, public._norm_phone(p_phone), 'Retrait vers ' || p_operator)
  returning id into v_tx;

  perform public._notify(v_uid, 'Retrait effectué',
    format('%s FCFA envoyés sur %s (%s).', public._fmt(p_amount), p_operator, public._norm_phone(p_phone)), 'SUCCESS');
  return jsonb_build_object('transaction_id', v_tx);
end $$;

create or replace function public.lookup_recipient(p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); r public.profiles; v_first text; v_last text;
begin
  select * into r from public.profiles where phone = public._norm_phone(p_phone);
  if not found then return jsonb_build_object('found', false); end if;
  if r.id = v_uid then return jsonb_build_object('found', false, 'self', true); end if;
  v_first := split_part(r.full_name, ' ', 1);
  v_last  := split_part(r.full_name, ' ', 2);
  return jsonb_build_object(
    'found', true,
    'name', trim(v_first || case when v_last <> '' then ' ' || left(v_last, 1) || '.' else '' end),
    'phone', r.phone
  );
end $$;

create or replace function public.wallet_transfer(p_phone text, p_amount bigint, p_note text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := public._uid();
  s     public.app_settings;
  me    public.profiles;
  dest  public.profiles;
  v_err text;
  v_ref text := 'KP' || upper(substr(md5(gen_random_uuid()::text), 1, 10));
  v_tx  uuid;
begin
  select * into s from public.app_settings where id = 1;
  select * into me from public.profiles where id = v_uid;
  select * into dest from public.profiles where phone = public._norm_phone(p_phone);
  if not found then raise exception 'Aucun compte Kodapay avec ce numéro'; end if;
  if dest.id = v_uid then raise exception 'Vous ne pouvez pas vous envoyer de l''argent'; end if;
  if p_amount is null or p_amount < s.min_transfer_fcfa then
    raise exception 'Montant minimum : % FCFA', public._fmt(s.min_transfer_fcfa);
  end if;

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  update public.profiles set balance_fcfa = balance_fcfa - (p_amount + s.transfer_fee_fcfa)
   where id = v_uid and balance_fcfa >= p_amount + s.transfer_fee_fcfa;
  if not found then raise exception 'Solde insuffisant'; end if;
  update public.profiles set balance_fcfa = balance_fcfa + p_amount where id = dest.id;

  insert into public.transactions (user_id, type, direction, amount_fcfa, fee_fcfa, phone, counterparty_name, description, reference)
  values (v_uid, 'TRANSFER_OUT', 'DEBIT', p_amount, s.transfer_fee_fcfa, dest.phone, dest.full_name,
          coalesce(nullif(trim(p_note), ''), 'Transfert Kodapay'), v_ref)
  returning id into v_tx;

  insert into public.transactions (user_id, type, direction, amount_fcfa, phone, counterparty_name, description, reference)
  values (dest.id, 'TRANSFER_IN', 'CREDIT', p_amount, me.phone, me.full_name,
          coalesce(nullif(trim(p_note), ''), 'Transfert Kodapay'), v_ref);

  perform public._notify(v_uid, 'Transfert envoyé',
    format('%s FCFA envoyés à %s.', public._fmt(p_amount), dest.full_name), 'SUCCESS');
  perform public._notify(dest.id, 'Argent reçu',
    format('Vous avez reçu %s FCFA de %s.', public._fmt(p_amount), coalesce(nullif(me.full_name, ''), me.phone)), 'SUCCESS');
  return jsonb_build_object('transaction_id', v_tx);
end $$;

-- ---------------------------------------------------------------------
-- 8. RPC : cartes virtuelles
-- ---------------------------------------------------------------------
create or replace function public.create_virtual_card(
  p_brand text, p_label text, p_holder text, p_initial_fcfa bigint, p_color text, p_pin text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := public._uid();
  s        public.app_settings;
  v_holder text := upper(trim(coalesce(p_holder, '')));
  v_total  bigint;
  v_usd    numeric;
  v_pan    text;
  v_card   uuid;
  v_err    text;
begin
  select * into s from public.app_settings where id = 1;
  if p_brand not in ('VISA', 'MASTERCARD') then raise exception 'Réseau invalide'; end if;
  if length(v_holder) < 2 or length(v_holder) > 26 or v_holder !~ '^[[:alpha:] .''-]+$' then
    raise exception 'Nom du titulaire invalide (lettres uniquement, 26 caractères max)';
  end if;
  if p_initial_fcfa is null or p_initial_fcfa < s.card_min_initial_fcfa then
    raise exception 'Rechargement initial minimum : % FCFA', public._fmt(s.card_min_initial_fcfa);
  end if;
  if (select count(*) from public.cards where user_id = v_uid and status <> 'TERMINATED') >= s.max_active_cards then
    raise exception 'Vous avez atteint le maximum de % cartes', s.max_active_cards;
  end if;

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  v_total := p_initial_fcfa + s.card_creation_fee_fcfa;
  update public.profiles set balance_fcfa = balance_fcfa - v_total
   where id = v_uid and balance_fcfa >= v_total;
  if not found then
    raise exception 'Solde insuffisant : % FCFA nécessaires (frais de création inclus)', public._fmt(v_total);
  end if;

  v_usd := round(p_initial_fcfa / s.usd_rate_fcfa, 2);
  v_pan := public._gen_pan(p_brand);

  insert into public.cards (user_id, label, brand, holder_name, last4, expiry_month, expiry_year, balance_usd, color)
  values (
    v_uid,
    coalesce(nullif(left(trim(p_label), 30), ''), 'Ma carte'),
    p_brand, v_holder, right(v_pan, 4),
    extract(month from now())::int, extract(year from now())::int + 3,
    v_usd,
    case when p_color in ('emerald', 'midnight', 'violet', 'sunset', 'ocean') then p_color else 'emerald' end
  )
  returning id into v_card;

  insert into public.card_secrets (card_id, pan, cvv)
  values (v_card, v_pan, lpad(floor(random() * 1000)::int::text, 3, '0'));

  insert into public.transactions (user_id, card_id, type, direction, amount_fcfa, amount_usd, fee_fcfa, description)
  values (v_uid, v_card, 'CARD_CREATION', 'DEBIT', p_initial_fcfa, v_usd, s.card_creation_fee_fcfa,
          'Création carte ' || initcap(p_brand) || ' •••• ' || right(v_pan, 4));

  perform public._notify(v_uid, 'Carte créée 💳',
    format('Votre carte %s •••• %s est active avec un solde de $%s.', initcap(p_brand), right(v_pan, 4), v_usd), 'SUCCESS');
  return jsonb_build_object('card_id', v_card);
end $$;

create or replace function public.card_fund(p_card_id uuid, p_amount_fcfa bigint, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; c public.cards; v_fee bigint; v_usd numeric; v_err text;
begin
  select * into s from public.app_settings where id = 1;
  c := public._my_card(v_uid, p_card_id);
  if c.status <> 'ACTIVE' then raise exception 'Dégelez la carte avant de la recharger'; end if;
  if p_amount_fcfa is null or p_amount_fcfa < s.card_min_fund_fcfa then
    raise exception 'Montant minimum : % FCFA', public._fmt(s.card_min_fund_fcfa);
  end if;
  v_fee := ceil(p_amount_fcfa * s.card_fund_fee_percent / 100);
  v_usd := round(p_amount_fcfa / s.usd_rate_fcfa, 2);

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  update public.profiles set balance_fcfa = balance_fcfa - (p_amount_fcfa + v_fee)
   where id = v_uid and balance_fcfa >= p_amount_fcfa + v_fee;
  if not found then
    raise exception 'Solde insuffisant (% FCFA nécessaires, frais inclus)', public._fmt(p_amount_fcfa + v_fee);
  end if;

  update public.cards set balance_usd = balance_usd + v_usd where id = c.id;

  insert into public.transactions (user_id, card_id, type, direction, amount_fcfa, amount_usd, fee_fcfa, description)
  values (v_uid, c.id, 'CARD_FUNDING', 'DEBIT', p_amount_fcfa, v_usd, v_fee, 'Recharge carte •••• ' || c.last4);

  perform public._notify(v_uid, 'Carte rechargée',
    format('+$%s sur votre carte •••• %s.', v_usd, c.last4), 'SUCCESS');
  return jsonb_build_object('amount_usd', v_usd);
end $$;

create or replace function public.card_unload(p_card_id uuid, p_amount_usd numeric, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; c public.cards; v_fcfa bigint; v_err text;
begin
  select * into s from public.app_settings where id = 1;
  c := public._my_card(v_uid, p_card_id);
  if c.status <> 'ACTIVE' then raise exception 'Dégelez la carte avant de retirer'; end if;
  p_amount_usd := round(p_amount_usd, 2);
  if p_amount_usd is null or p_amount_usd < 1 then raise exception 'Montant minimum : $1'; end if;
  if p_amount_usd > c.balance_usd then raise exception 'Solde de la carte insuffisant'; end if;
  v_fcfa := floor(p_amount_usd * s.usd_sell_rate_fcfa);

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  update public.cards set balance_usd = balance_usd - p_amount_usd where id = c.id;
  update public.profiles set balance_fcfa = balance_fcfa + v_fcfa where id = v_uid;

  insert into public.transactions (user_id, card_id, type, direction, amount_fcfa, amount_usd, description)
  values (v_uid, c.id, 'CARD_UNLOAD', 'CREDIT', v_fcfa, p_amount_usd, 'Retrait carte •••• ' || c.last4);

  perform public._notify(v_uid, 'Retrait de carte',
    format('$%s retirés de la carte •••• %s : %s FCFA crédités sur votre solde.', p_amount_usd, c.last4, public._fmt(v_fcfa)), 'SUCCESS');
  return jsonb_build_object('amount_fcfa', v_fcfa);
end $$;

create or replace function public.card_set_frozen(p_card_id uuid, p_frozen boolean, p_pin text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); c public.cards; v_err text;
begin
  c := public._my_card(v_uid, p_card_id);
  if not p_frozen then
    v_err := public._check_pin(v_uid, p_pin);
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
  end if;
  update public.cards set status = case when p_frozen then 'FROZEN' else 'ACTIVE' end where id = c.id;
  perform public._notify(v_uid,
    case when p_frozen then 'Carte gelée' else 'Carte dégelée' end,
    format('Votre carte •••• %s est maintenant %s.', c.last4, case when p_frozen then 'gelée' else 'active' end),
    case when p_frozen then 'WARNING' else 'INFO' end);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.card_terminate(p_card_id uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; c public.cards; v_fcfa bigint := 0; v_err text;
begin
  select * into s from public.app_settings where id = 1;
  c := public._my_card(v_uid, p_card_id);

  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;

  if c.balance_usd > 0 then
    v_fcfa := floor(c.balance_usd * s.usd_sell_rate_fcfa);
    update public.profiles set balance_fcfa = balance_fcfa + v_fcfa where id = v_uid;
  end if;
  update public.cards set status = 'TERMINATED', balance_usd = 0 where id = c.id;

  insert into public.transactions (user_id, card_id, type, direction, amount_fcfa, amount_usd, description)
  values (v_uid, c.id, 'CARD_TERMINATION', case when v_fcfa > 0 then 'CREDIT' else 'NONE' end,
          v_fcfa, c.balance_usd, 'Suppression carte •••• ' || c.last4);

  perform public._notify(v_uid, 'Carte supprimée',
    format('La carte •••• %s a été supprimée. %s FCFA remboursés sur votre solde.', c.last4, public._fmt(v_fcfa)), 'INFO');
  return jsonb_build_object('refund_fcfa', v_fcfa);
end $$;

create or replace function public.reveal_card(p_card_id uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); c public.cards; sec public.card_secrets; v_err text;
begin
  c := public._my_card(v_uid, p_card_id);
  v_err := public._check_pin(v_uid, p_pin);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  select * into sec from public.card_secrets where card_id = c.id;
  return jsonb_build_object(
    'pan', sec.pan,
    'cvv', sec.cvv,
    'expiry', lpad(c.expiry_month::text, 2, '0') || '/' || right(c.expiry_year::text, 2)
  );
end $$;

-- Mode démo uniquement : simule un achat en ligne avec la carte.
create or replace function public.simulate_card_payment(p_card_id uuid, p_merchant text, p_amount_usd numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := public._uid(); s public.app_settings; c public.cards; v_merchant text;
begin
  select * into s from public.app_settings where id = 1;
  if not s.simulation_mode then raise exception 'Disponible uniquement en mode démo'; end if;
  c := public._my_card(v_uid, p_card_id);
  v_merchant := coalesce(nullif(left(trim(p_merchant), 40), ''), 'Marchand en ligne');
  p_amount_usd := round(p_amount_usd, 2);
  if p_amount_usd is null or p_amount_usd <= 0 then raise exception 'Montant invalide'; end if;

  if c.status <> 'ACTIVE' or c.balance_usd < p_amount_usd then
    insert into public.transactions (user_id, card_id, type, direction, amount_usd, status, description, counterparty_name)
    values (v_uid, c.id, 'CARD_PAYMENT', 'NONE', p_amount_usd, 'FAILED',
            case when c.status <> 'ACTIVE' then 'Refusé : carte gelée' else 'Refusé : solde insuffisant' end, v_merchant);
    perform public._notify(v_uid, 'Paiement refusé',
      format('Paiement de $%s chez %s refusé (%s).', p_amount_usd, v_merchant,
             case when c.status <> 'ACTIVE' then 'carte gelée' else 'solde insuffisant' end), 'WARNING');
    return jsonb_build_object('error', 'Paiement refusé : ' ||
      case when c.status <> 'ACTIVE' then 'carte gelée' else 'solde insuffisant' end);
  end if;

  update public.cards set balance_usd = balance_usd - p_amount_usd where id = c.id;
  insert into public.transactions (user_id, card_id, type, direction, amount_usd, description, counterparty_name)
  values (v_uid, c.id, 'CARD_PAYMENT', 'DEBIT', p_amount_usd, 'Paiement ' || v_merchant, v_merchant);
  perform public._notify(v_uid, 'Paiement par carte',
    format('$%s payés chez %s avec la carte •••• %s.', p_amount_usd, v_merchant, c.last4), 'INFO');
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- 9. Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on function
  public._fmt(bigint), public._norm_phone(text), public._uid(),
  public._notify(uuid, text, text, text), public._check_pin(uuid, text),
  public._gen_pan(text), public._my_card(uuid, uuid), public.handle_new_user()
from public, anon, authenticated;

revoke execute on function
  public.set_pin(text, text), public.verify_pin(text), public.reset_pin_after_login(),
  public.update_profile(text, text), public.mark_notifications_read(),
  public.wallet_deposit(bigint, text, text), public.wallet_withdraw(bigint, text, text, text),
  public.lookup_recipient(text), public.wallet_transfer(text, bigint, text, text),
  public.create_virtual_card(text, text, text, bigint, text, text),
  public.card_fund(uuid, bigint, text), public.card_unload(uuid, numeric, text),
  public.card_set_frozen(uuid, boolean, text), public.card_terminate(uuid, text),
  public.reveal_card(uuid, text), public.simulate_card_payment(uuid, text, numeric)
from public, anon;

grant execute on function
  public.set_pin(text, text), public.verify_pin(text), public.reset_pin_after_login(),
  public.update_profile(text, text), public.mark_notifications_read(),
  public.wallet_deposit(bigint, text, text), public.wallet_withdraw(bigint, text, text, text),
  public.lookup_recipient(text), public.wallet_transfer(text, bigint, text, text),
  public.create_virtual_card(text, text, text, bigint, text, text),
  public.card_fund(uuid, bigint, text), public.card_unload(uuid, numeric, text),
  public.card_set_frozen(uuid, boolean, text), public.card_terminate(uuid, text),
  public.reveal_card(uuid, text), public.simulate_card_payment(uuid, text, numeric)
to authenticated;

-- ---------------------------------------------------------------------
-- 10. Profils pour les comptes déjà existants
-- ---------------------------------------------------------------------
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(trim(u.raw_user_meta_data ->> 'full_name'), '')
  from auth.users u
on conflict (id) do nothing;
