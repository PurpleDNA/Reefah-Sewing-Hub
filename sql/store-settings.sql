-- ============================================================================
-- store-settings.sql
-- A single editable row of store-wide settings surfaced on the public site
-- (footer contact + socials, About page copy) and edited from /admin/settings.
-- Run any time after 00_base_schema.sql (needs check_if_admin).
--
-- Convention mirrors admin-update-order-status.sql: RLS is enabled with a public
-- SELECT policy (the footer/About page are public) and NO write policy. The only
-- write path is the update_store_settings SECURITY DEFINER RPC, gated by
-- check_if_admin(auth.uid()).
-- ============================================================================

-- Singleton: id is forced to true, so the primary key allows exactly one row.
create table if not exists public.store_settings (
  id                    boolean primary key default true,
  store_name            text,
  store_email           text,
  store_phone           text,
  store_address         text,
  store_description     text,
  enable_reviews        boolean not null default true,
  enable_guest_checkout boolean not null default true,
  facebook_url          text,
  instagram_url         text,
  about_story           text,
  about_mission         text,
  about_values          jsonb not null default '[]'::jsonb,
  updated_at            timestamptz not null default now(),
  constraint store_settings_singleton  check (id),
  constraint store_settings_values_len check (jsonb_array_length(about_values) = 3)
);

-- Seed the single row with the values currently hardcoded across the app
-- (admin/settings/page.tsx, components/footer.tsx, app/about/page.tsx).
insert into public.store_settings (
  id, store_name, store_email, store_phone, store_address, store_description,
  enable_reviews, enable_guest_checkout, facebook_url, instagram_url,
  about_story, about_mission, about_values
) values (
  true,
  'REEFA SEWING HUB',
  'contact@reefasewinghub.com',
  '+233 24 657 0570',
  'TBD, Ghana',
  'Your one-stop sewing shop for beads, stones, trimming, threads and everything you need to create.',
  true,
  true,
  '',
  '',
  E'REEFA SEWING HUB started as a small sewing shop in Ghana. Founded in 2020, we began with a simple mission: to be a one-stop shop for quality fabrics, tailoring, and sewing supplies at affordable prices.\n\nWhat started as a small family business has grown into a trusted name in our community. We pride ourselves on knowing our customers by name and understanding their needs.\n\nToday, we''re expanding our reach through our online platform, bringing the same personalized service and quality products to more customers across Ghana.',
  'At REEFA SEWING HUB, we promise to continue providing quality products, excellent customer service, and a shopping experience that makes you feel like family. We''re committed to growing with our community and adapting to meet your needs.',
  '[
    {"title": "Quality", "description": "We carefully select our products to ensure we offer only the best quality items to our customers. From premium fabrics to sewing essentials, quality is our priority."},
    {"title": "Community", "description": "We believe in building strong relationships with our community. We source locally when possible and actively participate in community initiatives."},
    {"title": "Affordability", "description": "We strive to make quality fabrics and sewing supplies accessible to everyone by offering competitive prices and regular promotions on essential items."}
  ]'::jsonb
)
on conflict (id) do nothing;

-- RLS: anyone can read (public pages), nobody can write directly.
alter table public.store_settings enable row level security;

drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
  on public.store_settings
  for select
  using (true);

-- Admin-only write path. Validates the exactly-3 values rule before persisting.
create or replace function public.update_store_settings(
  p_store_name            text,
  p_store_email           text,
  p_store_phone           text,
  p_store_address         text,
  p_store_description     text,
  p_enable_reviews        boolean,
  p_enable_guest_checkout boolean,
  p_facebook_url          text,
  p_instagram_url         text,
  p_about_story           text,
  p_about_mission         text,
  p_about_values          jsonb
) returns public.store_settings as $$
declare
  result public.store_settings;
begin
  if not public.check_if_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if jsonb_typeof(p_about_values) is distinct from 'array'
     or jsonb_array_length(p_about_values) <> 3 then
    raise exception 'About values must contain exactly 3 entries';
  end if;

  update public.store_settings set
    store_name            = p_store_name,
    store_email           = p_store_email,
    store_phone           = p_store_phone,
    store_address         = p_store_address,
    store_description     = p_store_description,
    enable_reviews        = p_enable_reviews,
    enable_guest_checkout = p_enable_guest_checkout,
    facebook_url          = p_facebook_url,
    instagram_url         = p_instagram_url,
    about_story           = p_about_story,
    about_mission         = p_about_mission,
    about_values          = p_about_values,
    updated_at            = now()
  where id = true
  returning * into result;

  return result;
end;
$$ language plpgsql security definer;

grant execute on function public.update_store_settings(
  text, text, text, text, text, boolean, boolean, text, text, text, text, jsonb
) to authenticated;
