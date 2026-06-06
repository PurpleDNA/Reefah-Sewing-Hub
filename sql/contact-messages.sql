-- ============================================================================
-- contact-messages.sql
-- Stores submissions from the public Contact form. Anyone (including guests)
-- may submit; only admins can read, mark as read, or delete.
-- Run any time after 00_base_schema.sql (needs check_if_admin).
-- ============================================================================

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone can submit a message (the form is public, guests included).
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  with check (true);

-- Only admins can read submissions.
drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  using (public.check_if_admin(auth.uid()));

-- Only admins can mark messages read/unread.
drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
  on public.contact_messages
  for update
  using (public.check_if_admin(auth.uid()))
  with check (public.check_if_admin(auth.uid()));

-- Only admins can delete messages.
drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
  on public.contact_messages
  for delete
  using (public.check_if_admin(auth.uid()));
