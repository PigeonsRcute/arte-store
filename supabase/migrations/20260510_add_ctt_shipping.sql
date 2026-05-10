-- ============================================================
-- Migration: CTT weight-based shipping
-- Date: 2026-05-10
-- ============================================================

-- ---- 1. Product weights ----

alter table public.products
  add column if not exists weight_grams integer
    check (weight_grams is null or weight_grams > 0);

alter table public.nail_products
  add column if not exists weight_grams integer
    check (weight_grams is null or weight_grams > 0);

-- ---- 2. CTT rates table ----

create table public.ctt_rates (
  id               uuid primary key default gen_random_uuid(),
  service          text not null check (service in ('normal', 'expresso')),
  max_weight_grams integer not null check (max_weight_grams > 0),
  price_cents      integer not null check (price_cents >= 0),
  unique (service, max_weight_grams)
);

alter table public.ctt_rates enable row level security;

create policy "Anyone can read CTT rates"
  on public.ctt_rates for select
  using (true);

create policy "Admins can manage CTT rates"
  on public.ctt_rates for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 3. Seed CTT rates ----
-- Correio Normal (standard, untracked)
--   0-20g     → €0.75
--   21-50g    → €1.05
--   51-100g   → €1.40
--   101-250g  → €2.15
--   251-500g  → €3.20
--   501-1000g → €4.80
--   1001-2000g→ €7.50
--
-- CTT Expresso (tracked)
--   0-500g    → €4.50
--   501-1000g → €6.00
--   1001-2000g→ €8.50
--   2001-5000g→ €12.00

insert into public.ctt_rates (service, max_weight_grams, price_cents) values
  ('normal',   20,   75),
  ('normal',   50,  105),
  ('normal',  100,  140),
  ('normal',  250,  215),
  ('normal',  500,  320),
  ('normal', 1000,  480),
  ('normal', 2000,  750),
  ('expresso',  500,  450),
  ('expresso', 1000,  600),
  ('expresso', 2000,  850),
  ('expresso', 5000, 1200);

-- ---- 4. Orders: shipping service ----

alter table public.orders
  add column if not exists shipping_service text not null default 'normal'
    check (shipping_service in ('normal', 'expresso'));

-- ---- 5. Shipping settings: default service ----

alter table public.shipping_settings
  add column if not exists default_shipping_service text not null default 'normal'
    check (default_shipping_service in ('normal', 'expresso'));
