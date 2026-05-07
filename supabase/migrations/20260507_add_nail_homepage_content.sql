-- nail_homepage_content table
-- Stores per-section editable content for the /nails public homepage.
-- Mirrors the structure of homepage_content but is fully separate.

create table if not exists public.nail_homepage_content (
  id          uuid primary key default gen_random_uuid(),
  section     text unique not null,
  content     jsonb not null default '{}',
  is_active   boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- Reuse the existing set_updated_at() function (defined in homepage_content migration)
drop trigger if exists nail_homepage_content_updated_at on public.nail_homepage_content;
create trigger nail_homepage_content_updated_at
  before update on public.nail_homepage_content
  for each row execute function public.set_updated_at();

-- RLS
alter table public.nail_homepage_content enable row level security;

-- Public can read active sections
create policy "nail_homepage_content_public_read"
  on public.nail_homepage_content for select
  using (is_active = true);

-- Admins can read all rows (including inactive)
create policy "nail_homepage_content_admin_read"
  on public.nail_homepage_content for select
  using (public.is_admin());

-- Only admins can insert / update / delete
create policy "nail_homepage_content_admin_write"
  on public.nail_homepage_content for insert
  with check (public.is_admin());

create policy "nail_homepage_content_admin_update"
  on public.nail_homepage_content for update
  using (public.is_admin());

create policy "nail_homepage_content_admin_delete"
  on public.nail_homepage_content for delete
  using (public.is_admin());

-- Seed default rows for all 7 nails homepage sections
-- All seeded with is_active = false — enable each in the admin editor
insert into public.nail_homepage_content (section, content, is_active) values

  ('announcements_bar', '{
    "text": "Free shipping on nail orders over $50",
    "link": "/nails/shop",
    "link_label": "Shop sets"
  }', false),

  ('hero', '{
    "headline": "Your nails, your art.",
    "subheadline": "Handcrafted press-on nails. Ready-made sets and fully custom designs.",
    "cta_text": "Shop Sets",
    "cta_link": "/nails/shop",
    "bg_image_url": ""
  }', false),

  ('promotions', '{
    "badge_label": "SALE",
    "blurb": "Limited-time deals on selected sets",
    "product_ids": [],
    "discount_text": "Up to 25% off"
  }', false),

  ('featured_products', '{
    "headline": "Featured Sets",
    "product_ids": []
  }', false),

  ('events', '{
    "headline": "Upcoming Events",
    "items": []
  }', false),

  ('coming_soon', '{
    "title": "New collection dropping soon...",
    "expected_date": "",
    "teaser_image_url": ""
  }', false),

  ('general_announcements', '{
    "items": []
  }', false)

on conflict (section) do nothing;
