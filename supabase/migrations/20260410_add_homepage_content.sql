-- homepage_content table
-- Stores per-section editable content for the public homepage.
-- Each row is one section (unique). Content shape is section-specific JSON.

create table if not exists public.homepage_content (
  id          uuid primary key default gen_random_uuid(),
  section     text unique not null,
  content     jsonb not null default '{}',
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists homepage_content_updated_at on public.homepage_content;
create trigger homepage_content_updated_at
  before update on public.homepage_content
  for each row execute function public.set_updated_at();

-- RLS
alter table public.homepage_content enable row level security;

-- Public can read active sections
create policy "homepage_content_public_read"
  on public.homepage_content for select
  using (is_active = true);

-- Admins can read all rows (including inactive)
create policy "homepage_content_admin_read"
  on public.homepage_content for select
  using (public.is_admin());

-- Only admins can insert / update / delete
create policy "homepage_content_admin_write"
  on public.homepage_content for insert
  with check (public.is_admin());

create policy "homepage_content_admin_update"
  on public.homepage_content for update
  using (public.is_admin());

create policy "homepage_content_admin_delete"
  on public.homepage_content for delete
  using (public.is_admin());

-- Seed default rows for every homepage section
-- These are safe to re-run (ON CONFLICT DO NOTHING)
insert into public.homepage_content (section, content, is_active) values
  ('announcements', '{
    "text": "Free shipping on orders over $75",
    "link": "/shop",
    "link_label": "Shop now"
  }', true),

  ('hero', '{
    "headline": "Pigeon''s Artillery",
    "subheadline": "Original artwork. Bold colour. Made to hang.",
    "cta_text": "Explore the Gallery",
    "cta_link": "/shop",
    "bg_image_url": ""
  }', true),

  ('promotions', '{
    "badge_label": "SALE",
    "blurb": "Limited-time deals on selected originals",
    "product_ids": [],
    "discount_text": "Up to 30% off"
  }', false),

  ('featured_products', '{
    "headline": "New Releases",
    "product_ids": []
  }', true),

  ('events', '{
    "headline": "Upcoming Events",
    "items": []
  }', true),

  ('coming_soon', '{
    "title": "Something new is loading...",
    "expected_date": "",
    "teaser_image_url": ""
  }', false),

  ('footer', '{
    "tagline": "Art that hits like artillery.",
    "shop_link": "/shop",
    "contact_link": "/contact",
    "social_links": []
  }', true)

on conflict (section) do nothing;
