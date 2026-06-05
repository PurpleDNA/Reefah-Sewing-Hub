-- ============================================================================
-- admin-update-order-status.sql
-- Lets an admin change ONLY an order's fulfilment `status` (the admin order
-- page). Run any time after 00_base_schema.sql.
--
-- orders has RLS enabled with no UPDATE policy on purpose: every write goes
-- through a SECURITY DEFINER RPC (create_order, update_pending_order,
-- mark_payment_status). This adds the matching admin RPC instead of a broad
-- UPDATE policy, so admins can touch the status column and nothing else
-- (not total, payment_status, customer details, ...).
-- ============================================================================

-- Clean up the broad UPDATE policy from an earlier iteration, if it was applied.
drop policy if exists "Admins can update orders" on public.orders;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status   text
) returns boolean as $$
begin
  if not public.check_if_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('pending', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update public.orders
     set status     = p_status,
         updated_at = now()
   where id = p_order_id;

  return found;   -- false when no such order
end;
$$ language plpgsql security definer;

grant execute on function public.admin_update_order_status(uuid, text) to authenticated;
