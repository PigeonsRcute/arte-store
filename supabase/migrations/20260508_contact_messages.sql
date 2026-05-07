-- ============================================================
-- Migration: contact_messages
-- Date: 2026-05-08
--
-- Changes:
--   1. contact_messages table with RLS
--      - anyone can insert (public contact form)
--      - only admins can read/update
--   2. Seed admin_permissions for 'contact' section (owner only)
-- ============================================================


-- ---- 1. contact_messages ----

create table public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  subject    text        not null,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert
  with check (true);

create policy "Admins can read contact messages"
  on public.contact_messages for select
  using (public.is_admin());

create policy "Admins can update contact messages"
  on public.contact_messages for update
  using (public.is_admin())
  with check (public.is_admin());


-- ---- 2. Seed admin_permissions ----

insert into public.admin_permissions (role, section, can_read, can_write) values
  ('owner', 'contact', true, true)
on conflict (role, section) do update
  set can_read  = excluded.can_read,
      can_write = excluded.can_write;
