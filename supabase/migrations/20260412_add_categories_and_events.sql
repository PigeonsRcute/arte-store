-- ============================================================
-- Migration: categories, product_categories, events, event_products, event_categories
-- Date: 2026-04-12
-- ============================================================

-- ---- ENUMS ----

create type public.event_status as enum ('draft', 'scheduled', 'live', 'ended');
create type public.discount_type as enum ('percent', 'fixed');

-- ---- CATEGORIES ----

create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  cover_image_url text,
  gradient_from  text not null default '#6366f1',
  gradient_to    text not null default '#ec4899',
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Public can read categories
create policy "Anyone can read categories"
  on public.categories for select
  using (true);

-- Admins can manage categories
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- PRODUCT_CATEGORIES (junction) ----

create table public.product_categories (
  product_id  uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

alter table public.product_categories enable row level security;

-- Public can read
create policy "Anyone can read product_categories"
  on public.product_categories for select
  using (true);

-- Admins can manage
create policy "Admins can manage product_categories"
  on public.product_categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- EVENTS (sale events) ----

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  banner_url      text,
  discount_type   public.discount_type not null default 'percent',
  discount_value  numeric(10,2) not null default 0 check (discount_value >= 0),
  status          public.event_status not null default 'draft',
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.events enable row level security;

-- Public can read live events (to show sale prices)
create policy "Anyone can read live events"
  on public.events for select
  using (status = 'live' or public.is_admin());

-- Admins can manage events
create policy "Admins can manage events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- Auto-update updated_at
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---- EVENT_PRODUCTS (per-product discount override) ----

create table public.event_products (
  event_id        uuid not null references public.events(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  discount_value  numeric(10,2),  -- null = use event default
  primary key (event_id, product_id)
);

alter table public.event_products enable row level security;

-- Public can read (needed to compute sale prices)
create policy "Anyone can read event_products"
  on public.event_products for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and (e.status = 'live' or public.is_admin())
    )
  );

-- Admins can manage
create policy "Admins can manage event_products"
  on public.event_products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- EVENT_CATEGORIES (per-category discount) ----

create table public.event_categories (
  event_id        uuid not null references public.events(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete cascade,
  discount_value  numeric(10,2),  -- null = use event default
  primary key (event_id, category_id)
);

alter table public.event_categories enable row level security;

-- Public can read (needed to compute sale prices)
create policy "Anyone can read event_categories"
  on public.event_categories for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and (e.status = 'live' or public.is_admin())
    )
  );

-- Admins can manage
create policy "Admins can manage event_categories"
  on public.event_categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- SEED: default categories ----
-- "New Releases" is a real DB row, sorted first.
-- Remaining categories mirror the old hardcoded CATEGORY_OPTIONS in ProductForm.

insert into public.categories (name, slug, description, gradient_from, gradient_to, sort_order) values
  ('New Releases',  'new-releases', 'The latest additions to the store, sorted by newest first.', '#f59e0b', '#ef4444', 0),
  ('Prints',        'prints',       'High-quality art prints.',  '#6366f1', '#8b5cf6', 1),
  ('Stickers',      'stickers',     'Die-cut and sheet stickers.', '#ec4899', '#f43f5e', 2),
  ('Pins',          'pins',         'Enamel and acrylic pins.',   '#10b981', '#06b6d4', 3),
  ('T-Shirts',      't-shirts',     'Wearable art.',              '#3b82f6', '#6366f1', 4),
  ('Keychains',     'keychains',    'Acrylic and metal keychains.', '#f97316', '#eab308', 5),
  ('Other',         'other',        'Everything else.',            '#71717a', '#a1a1aa', 6)
on conflict (slug) do nothing;
