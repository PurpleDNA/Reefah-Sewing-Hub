-- ============================================================================
-- order-status-on-payment.sql
-- Auto-advance an order's fulfilment status to 'processing' the moment its
-- payment lands. Run AFTER flutterwave-payments.sql.
--
-- Why a trigger (not app code): mark_payment_status (the webhook RPC) sets
-- orders.payment_status = 'paid'. A BEFORE UPDATE trigger catches *every* path
-- that marks an order paid — webhook, manual admin fix, backfill — and keeps
-- status in sync without a second UPDATE or any risk of recursion.
--
-- We only auto-advance from 'pending' (awaiting payment). If an admin has
-- already moved the order along (shipped/delivered/cancelled), we leave it.
-- ============================================================================

create or replace function public.set_order_processing_on_payment()
returns trigger as $$
begin
  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid'
     and new.status = 'pending' then
    new.status := 'processing';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_order_processing_on_payment on public.orders;
create trigger trg_order_processing_on_payment
  before update on public.orders
  for each row
  execute function public.set_order_processing_on_payment();
