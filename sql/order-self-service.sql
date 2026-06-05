-- ============================================================================
-- order-self-service.sql
-- Lets a customer edit or delete their own order WHILE it is still awaiting
-- payment (orders.payment_status = 'pending_payment'). Run AFTER
-- flutterwave-payments.sql (which adds the payment_status column).
--
-- Both functions are SECURITY DEFINER and re-check ownership + payment_status
-- inside the function, mirroring the create_order / create_payment pattern.
-- This keeps column/row restrictions in one place instead of relying on
-- column-level RLS: a customer can only ever touch shipping/contact fields of
-- their own pending order, never `total`, `payment_status`, or someone else's.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- update_pending_order — edit shipping/contact details of one's own order,
-- only while it is pending_payment. Returns true when a row was updated.
-- ----------------------------------------------------------------------------
create or replace function public.update_pending_order(
  p_order_id    uuid,
  p_first_name  text,
  p_last_name   text,
  p_email       text,
  p_phone       text,
  p_address     text,
  p_city        text,
  p_state       text,
  p_postal_code text
) returns boolean as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if not found then
    return false;
  end if;

  if v_order.user_id is distinct from auth.uid() then
    raise exception 'Not authorized to edit this order';
  end if;

  if v_order.payment_status <> 'pending_payment' then
    raise exception 'Order can no longer be edited';
  end if;

  update public.orders set
    first_name  = p_first_name,
    last_name   = p_last_name,
    email       = p_email,
    phone       = p_phone,
    address     = p_address,
    city        = p_city,
    state       = p_state,
    postal_code = p_postal_code,
    updated_at  = now()
  where id = p_order_id;

  return true;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- delete_pending_order — delete one's own order while it is pending_payment.
-- order_items and payments cascade via their FK (on delete cascade).
-- ----------------------------------------------------------------------------
create or replace function public.delete_pending_order(
  p_order_id uuid
) returns boolean as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if not found then
    return false;
  end if;

  if v_order.user_id is distinct from auth.uid() then
    raise exception 'Not authorized to delete this order';
  end if;

  if v_order.payment_status <> 'pending_payment' then
    raise exception 'Order can no longer be deleted';
  end if;

  delete from public.orders where id = p_order_id;  -- cascades order_items + payments

  return true;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- Grants — authenticated is the role logged-in customers run as.
-- ----------------------------------------------------------------------------
grant execute on function public.update_pending_order(uuid, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.delete_pending_order(uuid)                                                 to authenticated;
