-- ============================================================
-- Migration: nails tables
-- Date: 2026-05-05
--
-- Changes:
--   1. nail_products         — ready-made press-on products
--   2. nail_materials        — internal material inventory
--   3. nail_pricing_rules    — base price per shape+length combo
--   4. nail_extras           — add-on options with cost
--   5. nail_custom_orders    — submitted custom order requests
--   6. nail_sizing_submissions — per-finger size submissions
--   7. cart_items update     — add nullable nail_product_id FK
--                              with XOR CHECK constraint
--   8. Seed nail_pricing_rules (6 shapes × 4 lengths)
--   9. Seed nail_extras defaults
-- ============================================================


-- ---- 1. nail_products ----

create table public.nail_products (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        unique not null,
  name         text        not null,
  description  text,
  images       text[]      not null default '{}',
  price_cents  integer     not null check (price_cents >= 0),
  shape        text        not null check (shape in ('coffin','almond','square','stiletto','oval','ballerina')),
  length       text        not null check (length in ('short','medium','long','extra_long')),
  finish       text        not null check (finish in ('glossy','matte','chrome','holographic','velvet')),
  stock_qty    integer     not null default 0 check (stock_qty >= 0),
  is_published boolean     not null default false,
  created_at   timestamptz not null default now()
);

alter table public.nail_products enable row level security;

create policy "Anyone can read published nail products"
  on public.nail_products for select
  using (is_published = true or public.is_admin());

create policy "Admins can manage nail products"
  on public.nail_products for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---- 2. nail_materials ----

create table public.nail_materials (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  cost_cents  integer     not null check (cost_cents >= 0),
  unit        text        not null,
  supplier    text,
  stock_qty   numeric     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.nail_materials enable row level security;

create policy "Admins can manage nail materials"
  on public.nail_materials for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---- 3. nail_pricing_rules ----

create table public.nail_pricing_rules (
  id                uuid        primary key default gen_random_uuid(),
  shape             text        not null check (shape in ('coffin','almond','square','stiletto','oval','ballerina')),
  length            text        not null check (length in ('short','medium','long','extra_long')),
  base_price_cents  integer     not null check (base_price_cents >= 0),
  updated_at        timestamptz not null default now(),
  unique (shape, length)
);

alter table public.nail_pricing_rules enable row level security;

create policy "Anyone can read nail pricing rules"
  on public.nail_pricing_rules for select
  using (true);

create policy "Admins can manage nail pricing rules"
  on public.nail_pricing_rules for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger set_nail_pricing_rules_updated_at
  before update on public.nail_pricing_rules
  for each row execute function public.set_updated_at();


-- ---- 4. nail_extras ----

create table public.nail_extras (
  id          uuid        primary key default gen_random_uuid(),
  name        text        unique not null,
  cost_type   text        not null check (cost_type in ('flat','per_unit')),
  cost_cents  integer     not null check (cost_cents >= 0),
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

alter table public.nail_extras enable row level security;

create policy "Anyone can read nail extras"
  on public.nail_extras for select
  using (is_active = true or public.is_admin());

create policy "Admins can manage nail extras"
  on public.nail_extras for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---- 5. nail_custom_orders ----

create table public.nail_custom_orders (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null references auth.users(id) on delete cascade,
  shape                  text        not null,
  length                 text        not null,
  finish                 text        not null,
  design                 jsonb       not null default '{}',
  extras                 jsonb       not null default '[]',
  sizes                  jsonb       not null default '{}',
  reference_images       text[]      not null default '{}',
  calculated_price_cents integer,
  final_price_cents      integer,
  status                 text        not null default 'quote_pending'
    check (status in ('quote_pending','quoted','confirmed','in_progress','shipped','cancelled')),
  admin_notes            text,
  created_at             timestamptz not null default now()
);

alter table public.nail_custom_orders enable row level security;

create policy "Users can read own nail custom orders"
  on public.nail_custom_orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Authenticated users can create custom orders"
  on public.nail_custom_orders for insert
  with check (user_id = auth.uid());

create policy "Admins can update custom orders"
  on public.nail_custom_orders for update
  using (public.is_admin())
  with check (public.is_admin());


-- ---- 6. nail_sizing_submissions ----

create table public.nail_sizing_submissions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  sizes        jsonb       not null,
  order_id     uuid        references public.nail_custom_orders(id) on delete set null,
  submitted_at timestamptz not null default now()
);

alter table public.nail_sizing_submissions enable row level security;

create policy "Users can read own sizing submissions"
  on public.nail_sizing_submissions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Authenticated users can submit sizes"
  on public.nail_sizing_submissions for insert
  with check (user_id = auth.uid());

create policy "Admins can update sizing submissions"
  on public.nail_sizing_submissions for update
  using (public.is_admin());


-- ---- 7. Update cart_items ----

-- product_id must become nullable to allow nail-only rows
alter table public.cart_items
  alter column product_id drop not null;

-- FK to nail_products
alter table public.cart_items
  add column nail_product_id uuid references public.nail_products(id) on delete cascade;

-- Exactly one of product_id or nail_product_id must be set (XOR)
alter table public.cart_items
  add constraint cart_items_one_product_type check (
    (product_id is not null and nail_product_id is null) or
    (product_id is null     and nail_product_id is not null)
  );

-- Partial unique index: one nail product per user per cart
-- (existing UNIQUE (user_id, product_id) handles the art side;
--  that constraint ignores NULLs so nail rows don't conflict with it)
create unique index cart_items_user_nail_product_unique
  on public.cart_items (user_id, nail_product_id)
  where nail_product_id is not null;


-- ---- 8. Seed nail_pricing_rules (6 shapes × 4 lengths) ----
-- Prices in cents (USD). Adjust from admin panel after launch.

insert into public.nail_pricing_rules (shape, length, base_price_cents) values
  ('coffin',    'short',      2500),
  ('coffin',    'medium',     2800),
  ('coffin',    'long',       3200),
  ('coffin',    'extra_long', 3800),
  ('almond',    'short',      2500),
  ('almond',    'medium',     2800),
  ('almond',    'long',       3200),
  ('almond',    'extra_long', 3800),
  ('square',    'short',      2200),
  ('square',    'medium',     2500),
  ('square',    'long',       2900),
  ('square',    'extra_long', 3400),
  ('stiletto',  'short',      2800),
  ('stiletto',  'medium',     3200),
  ('stiletto',  'long',       3600),
  ('stiletto',  'extra_long', 4200),
  ('oval',      'short',      2200),
  ('oval',      'medium',     2500),
  ('oval',      'long',       2900),
  ('oval',      'extra_long', 3400),
  ('ballerina', 'short',      2800),
  ('ballerina', 'medium',     3200),
  ('ballerina', 'long',       3600),
  ('ballerina', 'extra_long', 4200)
on conflict (shape, length) do update
  set base_price_cents = excluded.base_price_cents,
      updated_at       = now();


-- ---- 9. Seed nail_extras ----

insert into public.nail_extras (name, cost_type, cost_cents, description, is_active) values
  ('Gems',        'per_unit', 150,  'Rhinestone gems applied per nail',    true),
  ('Foil',        'flat',     500,  'Metallic foil accent across all nails', true),
  ('3D Elements', 'per_unit', 300,  'Sculpted 3D nail art per nail',       true),
  ('Nail Art',    'flat',     800,  'Custom hand-painted design on all nails', true),
  ('Glitter',     'flat',     400,  'Full glitter overlay on all nails',   true),
  ('French Tip',  'flat',     300,  'Classic or colored french tip finish', true)
on conflict (name) do update
  set cost_type   = excluded.cost_type,
      cost_cents  = excluded.cost_cents,
      description = excluded.description,
      is_active   = excluded.is_active;
