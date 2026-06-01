-- ============================================================================
-- 00_base_schema.sql
-- Base table definitions for the Betza Store / Reefa Sewing Hub app.
--
-- Run this FIRST in the Supabase SQL editor, then run the other files in sql/
-- (RPC functions + RLS policies). Column names/types are reconstructed from the
-- application's queries and TypeScript types; adjust if you have the original dump.
--
-- Assumes Supabase (auth.users exists, pgcrypto provides gen_random_uuid()).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users; row created on sign-in by auth-provider.tsx)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  email        text,
  phone        text,
  address      text,
  city         text,
  state        text,
  postal_code  text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null default 0,
  sale_price    numeric(10,2),
  image_url     text,
  category_id   uuid references public.categories (id) on delete set null,
  stock         integer not null default 0,
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_featured_idx     on public.products (featured);

-- ----------------------------------------------------------------------------
-- orders  (created via the create_order RPC; user_id nullable for guest orders)
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,
  total        numeric(10,2) not null default 0,
  first_name   text,
  last_name    text,
  email        text,
  phone        text,
  address      text,
  city         text,
  state        text,
  postal_code  text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx  on public.orders (status);

-- ----------------------------------------------------------------------------
-- order_items
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  quantity    integer not null default 1,
  price       numeric(10,2) not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists order_items_order_id_idx   on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews (product_id);
create index if not exists reviews_user_id_idx    on public.reviews (user_id);

-- ----------------------------------------------------------------------------
-- user_carts  (one row per user; items stored as a jsonb array of CartItem)
-- ----------------------------------------------------------------------------
create table if not exists public.user_carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles (id) on delete cascade,
  items       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Enable Row Level Security on all tables.
-- Detailed policies live in the other sql/ files (fix-rls-policies.sql,
-- fix-product-operations-improved.sql). Minimal policies below cover the
-- tables those files don't, so the app works after a fresh setup.
-- ----------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.user_carts  enable row level security;

-- categories: public read, admin write
drop policy if exists "Everyone can view categories" on public.categories;
create policy "Everyone can view categories"
  on public.categories for select using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using     (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- order_items: visible if you own the parent order (or are admin); insertable by owner
drop policy if exists "View own order items" on public.order_items;
create policy "View own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid()
           or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  ));

drop policy if exists "Insert own order items" on public.order_items;
create policy "Insert own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or o.user_id is null)
  ));

-- reviews: public read, authenticated users manage their own
drop policy if exists "Everyone can view reviews" on public.reviews;
create policy "Everyone can view reviews"
  on public.reviews for select using (true);

drop policy if exists "Users manage their own reviews" on public.reviews;
create policy "Users manage their own reviews"
  on public.reviews for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- user_carts: each user can only see/modify their own cart
drop policy if exists "Users manage their own cart" on public.user_carts;
create policy "Users manage their own cart"
  on public.user_carts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- orders insert: allow logged-in users (and guest/null) to create their orders.
-- (SELECT policy for orders is defined in fix-rls-policies.sql.)
drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders"
  on public.orders for insert
  with check (user_id = auth.uid() or user_id is null);
