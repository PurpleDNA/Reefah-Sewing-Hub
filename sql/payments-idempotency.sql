-- ============================================================================
-- payments-idempotency.sql
-- Delta over flutterwave-payments.sql: guarantees one collectable payment per order.
--
-- Run this in the Supabase SQL editor on an already-deployed payments schema.
-- (flutterwave-payments.sql already contains these changes for fresh installs;
--  this file is the standalone delta for existing databases.)
--
-- Pairs with the app-side change in /api/payments/initiate, which now reuses an
-- existing pending virtual account instead of minting a new one per call.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. At most one *active* payment per order.
--    Blocks a second live virtual account (= a second collectable transfer)
--    from being created for the same order, even under concurrent initiate calls.
--
--    NOTE: this will error if duplicate active rows already exist. Check first:
--      select order_id, count(*) from public.payments
--      where status in ('pending','succeeded')
--      group by order_id having count(*) > 1;
--    Resolve any duplicates (mark superseded ones 'expired') before creating it.
-- ----------------------------------------------------------------------------
create unique index if not exists payments_one_active_per_order
  on public.payments (order_id)
  where status in ('pending', 'succeeded');

-- ----------------------------------------------------------------------------
-- 2. Add an order-already-paid backstop to mark_payment_status so a stray second
--    payment row can never re-confirm an order that's already paid.
-- ----------------------------------------------------------------------------
create or replace function public.mark_payment_status(
  p_reference     text,
  p_flw_charge_id text,
  p_status        text
) returns boolean as $$
declare
  v_payment public.payments%rowtype;
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

  update public.payments
     set status        = p_status,
         flw_charge_id  = coalesce(p_flw_charge_id, flw_charge_id),
         updated_at     = now()
   where id = v_payment.id;

  update public.orders
     set payment_status = case when p_status = 'succeeded' then 'paid' else p_status end,
         updated_at     = now()
   where id = v_payment.order_id;

  return true;
end;
$$ language plpgsql security definer;
