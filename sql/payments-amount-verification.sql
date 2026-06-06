-- ============================================================================
-- payments-amount-verification.sql
-- Delta over flutterwave-payments.sql: verify the amount actually received
-- against the order total, with an accept-and-flag policy for overpayment.
--
-- Run this in the Supabase SQL editor on an already-deployed payments schema.
-- (flutterwave-payments.sql already contains these changes for fresh installs;
--  this file is the standalone delta for existing databases.)
--
-- Pairs with the app-side change in /api/webhooks/flutterwave, which now passes
-- the gross amount the customer transferred into mark_payment_status.
--
-- Policy:
--   * underpaid (paid < expected)  -> NOT fulfilled. Payment + order flagged
--     'underpaid' for manual review; stock is not committed, status not advanced.
--   * exact or overpaid            -> accepted as 'paid'. Any surplus is recorded
--     in payments.overpaid_amount so an admin can refund it.
--   * amount unknown (null)        -> behave as before (don't drop a real payment).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Track the actual amount received and any surplus owed back.
-- ----------------------------------------------------------------------------
alter table public.payments
  add column if not exists amount_paid     numeric(10,2),
  add column if not exists overpaid_amount numeric(10,2) not null default 0;

-- ----------------------------------------------------------------------------
-- 2. Replace mark_payment_status with an amount-aware version.
--    The signature gains p_amount_paid, so drop the old 3-arg function first
--    (create-or-replace would otherwise leave two overloads → ambiguity).
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

  -- Backstop: if the order is already paid, never re-confirm against it.
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

grant execute on function public.mark_payment_status(text, text, text, numeric) to anon, authenticated;
