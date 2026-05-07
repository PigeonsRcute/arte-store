-- ============================================================
-- Migration: role-based permissions system
-- Date: 2026-05-05
--
-- Changes:
--   1. Drop RLS policies that reference profiles.role (blocks ALTER COLUMN)
--   2. Convert profiles.role from user_role enum to text
--   3. Migrate 'admin' → 'owner', add CHECK constraint for 5 admin roles
--   4. Update handle_new_user() trigger (no more enum cast)
--   5. Update is_admin() to accept all non-customer roles
--   6. Recreate the dropped policies using is_admin()
--   7. Create admin_permissions table with RLS + seeded defaults
-- ============================================================


-- ---- 1. Drop policies that reference profiles.role ----
-- These must go before ALTER COLUMN or Postgres refuses the type change.

drop policy if exists "Anyone can read published products" on public.products;
drop policy if exists "Admins can manage products"         on public.products;
drop policy if exists "Users can read own orders"          on public.orders;
drop policy if exists "Admins can update orders"           on public.orders;
drop policy if exists "Users/admins can read order items"  on public.order_items;
drop policy if exists "Admins can manage order items"      on public.order_items;
drop policy if exists "Admins can read all profiles"       on public.profiles;


-- ---- 2. Replace handle_new_user() before dropping the enum ----

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role, email)
  values (
    new.id,
    case
      when lower(coalesce(new.email, '')) = 'vascooliveirasilva@icloud.com' then 'owner'
      else 'customer'
    end,
    new.email
  );
  return new;
end;
$$;


-- ---- 3. Convert profiles.role to text ----

alter table public.profiles
  alter column role type text;


-- ---- 4. Drop old enum ----

drop type if exists public.user_role cascade;


-- ---- 5. Migrate existing data and add CHECK constraint ----

update public.profiles
  set role = 'owner'
  where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'owner', 'editor', 'support', 'viewer', 'nails_admin'));


-- ---- 6. Update is_admin() — true for any non-customer role ----

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role != 'customer'
  );
$$;


-- ---- 7. Recreate all dropped policies using is_admin() ----

create policy "Anyone can read published products"
  on public.products for select
  using (is_published = true or public.is_admin());

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can read own orders"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

create policy "Users/admins can read order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());


-- ---- 8. Create admin_permissions table ----

create table if not exists public.admin_permissions (
  role      text    not null,
  section   text    not null,
  can_read  boolean not null default false,
  can_write boolean not null default false,
  primary key (role, section)
);

alter table public.admin_permissions enable row level security;

create policy "Authenticated users can read permissions"
  on public.admin_permissions for select
  using (auth.uid() is not null);

create policy "Owner can manage permissions"
  on public.admin_permissions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'owner'
    )
  );


-- ---- 9. Seed default permissions ----

insert into public.admin_permissions (role, section, can_read, can_write) values
  ('owner', 'dashboard',  true, true),
  ('owner', 'products',   true, true),
  ('owner', 'homepage',   true, true),
  ('owner', 'events',     true, true),
  ('owner', 'orders',     true, true),
  ('owner', 'customers',  true, true),
  ('owner', 'reviews',    true, true),
  ('owner', 'shipping',   true, true),
  ('owner', 'analytics',  true, true),
  ('owner', 'team',       true, true),
  ('owner', 'nails',      true, true),
  ('owner', 'settings',   true, true),

  ('editor', 'dashboard', true,  false),
  ('editor', 'products',  true,  true),
  ('editor', 'homepage',  true,  true),
  ('editor', 'events',    true,  true),

  ('support', 'dashboard',  true, false),
  ('support', 'orders',     true, true),
  ('support', 'customers',  true, true),
  ('support', 'reviews',    true, true),

  ('viewer', 'dashboard',  true, false),
  ('viewer', 'analytics',  true, false),

  ('nails_admin', 'dashboard', true, false),
  ('nails_admin', 'nails',     true, true)

on conflict (role, section) do update
  set can_read  = excluded.can_read,
      can_write = excluded.can_write;
