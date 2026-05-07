-- ============================================================
-- Migration: shipping_zones, shipping_settings, events threshold
-- Date: 2026-05-04
-- ============================================================

-- ---- SHIPPING ZONES ----

create table public.shipping_zones (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  countries                 text[] not null default '{}',
  flat_rate_cents           integer not null default 0 check (flat_rate_cents >= 0),
  weight_rate_cents_per_kg  integer not null default 0 check (weight_rate_cents_per_kg >= 0)
);

alter table public.shipping_zones enable row level security;

create policy "Anyone can read shipping zones"
  on public.shipping_zones for select
  using (true);

create policy "Admins can manage shipping zones"
  on public.shipping_zones for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- SHIPPING SETTINGS (single-row global config) ----

create table public.shipping_settings (
  id                                    text primary key default 'default',
  global_free_shipping_threshold_cents  integer not null default 0 check (global_free_shipping_threshold_cents >= 0)
);

alter table public.shipping_settings enable row level security;

create policy "Anyone can read shipping settings"
  on public.shipping_settings for select
  using (true);

create policy "Admins can manage shipping settings"
  on public.shipping_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- EVENTS: free shipping threshold per event ----

alter table public.events
  add column if not exists free_shipping_threshold_cents integer
    check (free_shipping_threshold_cents is null or free_shipping_threshold_cents >= 0);

-- ---- SEED: default shipping zones ----
-- Rates are placeholders — edit them in /admin/shipping before launch.
-- Portugal        flat €3.50  + €0.50/kg
-- EU              flat €5.50  + €0.80/kg
-- UK              flat €6.50  + €1.00/kg
-- USA             flat €9.00  + €1.20/kg
-- Rest of World   flat €12.00 + €1.50/kg  (catch-all — empty countries array)

insert into public.shipping_zones (name, countries, flat_rate_cents, weight_rate_cents_per_kg) values
  (
    'Portugal',
    array['PT'],
    350,
    50
  ),
  (
    'EU Countries',
    array[
      'AT','BE','BG','CY','CZ','DE','DK','EE','ES',
      'FI','FR','GR','HR','HU','IE','IT','LT','LU',
      'LV','MT','NL','PL','RO','SE','SI','SK'
    ],
    550,
    80
  ),
  (
    'UK',
    array['GB'],
    650,
    100
  ),
  (
    'USA',
    array['US'],
    900,
    120
  ),
  (
    'Rest of World',
    array[]::text[],
    1200,
    150
  );

-- ---- SEED: global shipping settings ----
-- global_free_shipping_threshold_cents = 0 means disabled.
-- Set to e.g. 5000 (€50) once ready.

insert into public.shipping_settings (id, global_free_shipping_threshold_cents)
  values ('default', 0)
  on conflict (id) do nothing;
