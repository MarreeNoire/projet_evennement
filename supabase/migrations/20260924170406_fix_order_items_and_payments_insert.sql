-- =============================================================================
-- Migration: Allow inserting order_items and payments for own pending orders
-- =============================================================================

-- 1. order_items: allow users to insert items for their own pending orders
drop policy if exists order_items_insert_self on public.order_items;
create policy order_items_insert_self on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status in ('pending', 'paid')
    )
  );

-- 2. payments: allow users to insert payments for their own pending orders
drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self on public.payments
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status in ('pending', 'paid')
    )
  );

