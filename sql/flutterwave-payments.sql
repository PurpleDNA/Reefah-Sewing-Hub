-- ============================================================================
-- flutterwave-payments.sql
-- Adds Flutterwave "Pay With Bank Transfer" (v4) support.
--
-- Run this in the Supabase SQL editor AFTER 00_base_schema.sql.
--
-- Adds payment columns to orders, a payments table (one row per payment attempt;
-- stores the virtual-account details we show on the pay page), and two
-- SECURITY DEFINER RPCs that mirror create_order:
--   * create_payment       — insert a payment row (called from the initiate route)
--   * mark_payment_status   — idempotently transition a payment (called from the webhook)
-- The webhook has no user session, so it relies on SECURITY DEFINER to bypass RLS,
-- matching the create_order / check_if_admin pattern already used in this repo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- orders: payment tracking columns (defaulted so create_order stays unchanged)
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists payment_status text not null default 'pending_payment', -- pending_payment | paid | failed | expired
  add column if not exists currency       text not null default 'NGN';

-- ----------------------------------------------------------------------------
-- payments: one row per payment attempt
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders (id) on delete cascade,
  reference                text not null unique,             -- our tx_ref; also the FW virtual-account reference
  provider                 text not null default 'flutterwave',
  flw_virtual_account_id   text,                             -- FW virtual account id (correlates incoming charges)
  flw_charge_id            text,                             -- FW charge id from the webhook
  amount                   numeric(10,2) not null,            -- expected amount (the order total)
  amount_paid              numeric(10,2),                     -- actual amount received (set on settlement)
  overpaid_amount          numeric(10,2) not null default 0,  -- amount owed back to the customer (refund flag)
  currency                 text not null default 'NGN',
  account_number           text,
  account_bank_name        text,
  account_expiration       timestamptz,
  status                   text not null default 'pending',  -- pending | succeeded | failed | expired
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists payments_order_id_idx               on public.payments (order_id);
create index if not exists payments_flw_virtual_account_id_idx on public.payments (flw_virtual_account_id);

-- At most one *active* payment per order. Prevents a second live virtual account
-- (and thus a second collectable transfer) from ever being created for one order,
-- even under concurrent /api/payments/initiate calls.
create unique index if not exists payments_one_active_per_order
  on public.payments (order_id)
  where status in ('pending', 'succeeded');

alter table public.payments enable row level security;

-- Owners can read their own payment row (used by the pay page status polling).
-- Writes happen exclusively through the SECURITY DEFINER RPCs below.
drop policy if exists "View own payments" on public.payments;
create policy "View own payments"
  on public.payments for select
  using (exists (
    select 1 from public.orders o
    where o.id = payments.order_id
      and (o.user_id = auth.uid()
           or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  ));

-- ----------------------------------------------------------------------------
-- create_payment — insert a payment row (called from the initiate API route)
-- ----------------------------------------------------------------------------
create or replace function public.create_payment(
  p_order_id               uuid,
  p_reference              text,
  p_amount                 numeric,
  p_currency               text,
  p_flw_virtual_account_id text,
  p_account_number         text,
  p_account_bank_name      text,
  p_account_expiration     timestamptz
) returns uuid as $$
declare
  v_payment_id uuid;
begin
  insert into public.payments (
    order_id, reference, amount, currency,
    flw_virtual_account_id, account_number, account_bank_name, account_expiration
  ) values (
    p_order_id, p_reference, p_amount, coalesce(p_currency, 'NGN'),
    p_flw_virtual_account_id, p_account_number, p_account_bank_name, p_account_expiration
  )
  on conflict (reference) do update
    set flw_virtual_account_id = excluded.flw_virtual_account_id,
        account_number         = excluded.account_number,
        account_bank_name      = excluded.account_bank_name,
        account_expiration     = excluded.account_expiration,
        updated_at             = now()
  returning id into v_payment_id;

  return v_payment_id;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- mark_payment_status — idempotently transition a payment + mirror to its order,
-- verifying the amount actually received against the expected order total.
-- Returns true only when a change was applied (so the webhook can no-op retries).
-- Matches by reference OR flw_virtual_account_id (whichever the webhook resolves).
--
-- Amount policy (p_amount_paid is the gross amount the customer transferred):
--   * underpaid (paid < expected)  -> NOT fulfilled. Payment + order flagged
--     'underpaid' for manual review; stock is not committed, status not advanced.
--   * exact or overpaid            -> accepted as 'paid'. Any surplus is recorded
--     in payments.overpaid_amount so an admin can refund it (accept-and-flag).
--   * p_amount_paid null           -> skip the check, behave as before (don't drop
--     a real payment over a missing field).
-- ----------------------------------------------------------------------------
drop function if exists public.mark_payment_status(text, text, text);

create or replace function public.mark_payment_status(
  p_reference     text,
  p_flw_charge_id text,
  p_status        text,
  p_amount_paid   numeric default null
) returns boolean as $$
declare
  v_payment  public.payments%rowtype;
  v_overpaid numeric := 0;
begin
  select * into v_payment
  from public.payments
  where reference = p_reference
     or flw_virtual_account_id = p_reference
  limit 1;

  if not found then
    return false;                       -- unknown reference; nothing to do
  end if;

  if v_payment.status <> 'pending' then
    return false;                       -- already settled; idempotent no-op
  end if;

  -- Backstop: if the order is already paid (e.g. a stray second payment row from
  -- a pre-existing duplicate), never re-confirm against it.
  if exists (
    select 1 from public.orders o
    where o.id = v_payment.order_id and o.payment_status = 'paid'
  ) then
    return false;
  end if;

  -- Non-success outcomes (failed / expired): record and mirror, no amount logic.
  if p_status <> 'succeeded' then
    update public.payments
       set status        = p_status,
           amount_paid    = coalesce(p_amount_paid, amount_paid),
           flw_charge_id  = coalesce(p_flw_charge_id, flw_charge_id),
           updated_at     = now()
     where id = v_payment.id;

    update public.orders
       set payment_status = p_status,
           updated_at     = now()
     where id = v_payment.order_id;

    return true;
  end if;

  -- Underpayment: settled successfully but for less than the order total.
  -- Do not fulfil; flag both rows 'underpaid' for an admin to resolve.
  if p_amount_paid is not null and p_amount_paid < v_payment.amount then
    update public.payments
       set status        = 'underpaid',
           amount_paid    = p_amount_paid,
           flw_charge_id  = coalesce(p_flw_charge_id, flw_charge_id),
           updated_at     = now()
     where id = v_payment.id;

    update public.orders
       set payment_status = 'underpaid',
           updated_at     = now()
     where id = v_payment.order_id;

    return true;
  end if;

  -- Exact payment or overpayment: accept. Record any surplus as a refund owed.
  v_overpaid := greatest(coalesce(p_amount_paid, v_payment.amount) - v_payment.amount, 0);

  update public.payments
     set status          = 'succeeded',
         amount_paid      = coalesce(p_amount_paid, amount),
         overpaid_amount  = v_overpaid,
         flw_charge_id    = coalesce(p_flw_charge_id, flw_charge_id),
         updated_at       = now()
   where id = v_payment.id;

  update public.orders
     set payment_status = 'paid',
         updated_at     = now()
   where id = v_payment.order_id;

  return true;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- Grants — anon is the role the webhook (no session) and browser client run as.
-- ----------------------------------------------------------------------------
grant execute on function public.create_payment(uuid, text, numeric, text, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.mark_payment_status(text, text, text, numeric)                           to anon, authenticated;
