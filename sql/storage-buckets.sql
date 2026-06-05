-- ============================================================================
-- storage-buckets.sql
-- Creates the public Storage buckets used for admin image uploads and the RLS
-- policies on storage.objects that gate them.
--
-- Run this in the Supabase SQL editor (like the other files in sql/). Safe to
-- re-run: bucket inserts are upserted and policies are dropped/recreated.
--
-- Buckets:
--   product-images   -- product photos (uploaded from the product editors)
--   category-images  -- category cover images (uploaded from /admin/categories)
--
-- Both are PUBLIC (read by anyone) since the storefront renders the images
-- directly. Writes (insert/update/delete) are restricted to admins, matching
-- the products/categories table policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create the buckets (public read). on conflict keeps re-runs idempotent.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('product-images',  'product-images',  true),
  ('category-images', 'category-images', true)
on conflict (id) do update set public = excluded.public;

-- ----------------------------------------------------------------------------
-- Admin check helper (SECURITY DEFINER so it bypasses RLS on profiles).
--
-- IMPORTANT: the storage policies below must NOT query public.profiles
-- directly. profiles has RLS enabled, and a direct subquery inside a storage
-- policy can return no rows (and evaluate to false) -> 403 on upload. Going
-- through this SECURITY DEFINER function avoids that, matching how the rest of
-- the app checks admin status (see sql/fix-rls-policies.sql). Created here with
-- CREATE OR REPLACE so this file is self-contained.
-- ----------------------------------------------------------------------------
create or replace function public.check_if_admin(user_id uuid)
returns boolean as $$
begin
  return (select is_admin from public.profiles where id = user_id);
exception
  when others then
    return false;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- Public read access to both buckets.
-- ----------------------------------------------------------------------------
drop policy if exists "Public read image buckets" on storage.objects;
create policy "Public read image buckets"
  on storage.objects for select
  using (bucket_id in ('product-images', 'category-images'));

-- ----------------------------------------------------------------------------
-- Admin write access (insert / update / delete) to both buckets.
-- ----------------------------------------------------------------------------
drop policy if exists "Admins can upload images" on storage.objects;
create policy "Admins can upload images"
  on storage.objects for insert
  with check (
    bucket_id in ('product-images', 'category-images')
    and public.check_if_admin(auth.uid())
  );

drop policy if exists "Admins can update images" on storage.objects;
create policy "Admins can update images"
  on storage.objects for update
  using (
    bucket_id in ('product-images', 'category-images')
    and public.check_if_admin(auth.uid())
  )
  with check (
    bucket_id in ('product-images', 'category-images')
    and public.check_if_admin(auth.uid())
  );

drop policy if exists "Admins can delete images" on storage.objects;
create policy "Admins can delete images"
  on storage.objects for delete
  using (
    bucket_id in ('product-images', 'category-images')
    and public.check_if_admin(auth.uid())
  );
