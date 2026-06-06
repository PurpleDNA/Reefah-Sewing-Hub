-- ============================================================================
-- stock-sync-on-order-status.sql
-- Keep products.stock in sync with order state, automatically.
-- Run AFTER 00_base_schema.sql and flutterwave-payments.sql.
--
-- Invariant maintained by the trigger below:
--   an order's items are deducted from stock  <=>  the order is `paid`
--   AND not `cancelled`.
--
-- This gives the behaviour we want:
--   * Stock is "booked down" the moment payment is confirmed (payment_status
--     -> 'paid'), so a paid item can't be sold to someone else.  This fires on
--     every path that marks an order paid: the Flutterwave webhook
--     (mark_payment_status), a manual admin fix, or a backfill.
--   * Cancelling an order that was already paid releases its stock back.
--     Cancelling an unpaid order changes nothing (nothing was ever deducted).
--
-- Why a flag column instead of reacting to raw transitions: the webhook can
-- retry, an admin can flip status back and forth, etc.  `stock_committed`
-- records whether THIS order currently holds stock, so we only ever deduct
-- once and only ever restore what we deducted (decrement/increment stay
-- perfectly symmetric — stock always returns to its original value).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Flag: are this order's items currently deducted from stock?
-- Existing rows default to false; the trigger below corrects state going
-- forward. (See the optional one-time backfill note at the bottom.)
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists stock_committed boolean not null default false;

-- ----------------------------------------------------------------------------
-- Apply or release this order's stock to match the target state.
-- SECURITY DEFINER so the products UPDATE bypasses RLS regardless of which
-- caller triggered the change (anon webhook, admin RPC, ...), matching the
-- create_order / mark_payment_status pattern used elsewhere in this repo.
-- ----------------------------------------------------------------------------
create or replace function public.sync_stock_on_order_change()
returns trigger as $$
declare
  -- Stock should be held while the order is paid and not cancelled.
  v_should_commit boolean := (new.payment_status = 'paid' and new.status <> 'cancelled');
begin
  if v_should_commit and not old.stock_committed then
    -- Book the stock down. product_id is nullable (set null on product delete);
    -- skip those rows.
    update public.products p
       set stock      = p.stock - oi.quantity,
           updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
    new.stock_committed := true;

  elsif (not v_should_commit) and old.stock_committed then
    -- Release the stock we previously booked down.
    update public.products p
       set stock      = p.stock + oi.quantity,
           updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
    new.stock_committed := false;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- BEFORE UPDATE so we can set new.stock_committed in place (no second UPDATE,
-- no recursion). Independent of trg_order_processing_on_payment: that trigger
-- may rewrite new.status pending->processing first, which doesn't affect the
-- v_should_commit test (both count as "not cancelled").
drop trigger if exists trg_stock_sync_on_order on public.orders;
create trigger trg_stock_sync_on_order
  before update on public.orders
  for each row
  execute function public.sync_stock_on_order_change();

-- ----------------------------------------------------------------------------
-- OPTIONAL one-time backfill: if you already have paid, non-cancelled orders
-- in production that should be holding stock, run this ONCE to deduct them and
-- set the flag. Skip it on a fresh DB. Review before running.
--
--   with committed as (
--     update public.orders
--        set stock_committed = true
--      where payment_status = 'paid' and status <> 'cancelled'
--        and stock_committed = false
--      returning id
--   )
--   update public.products p
--      set stock = p.stock - oi.quantity, updated_at = now()
--     from public.order_items oi
--    where oi.product_id = p.id
--      and oi.order_id in (select id from committed);
-- ----------------------------------------------------------------------------
