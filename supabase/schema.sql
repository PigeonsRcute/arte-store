create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

drop table if exists public.order_items cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.profiles cascade;

drop type if exists public.order_status cascade;
drop type if exists public.user_role cascade;

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  email text,
  street text,
  city text,
  postal_code text,
  country text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  image_urls text[] not null default '{}',
  sku text,
  category text,
  dimensions text,
  edition_size integer,
  shipping_cost_cents integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index products_sku_not_null_idx
on public.products (sku)
where sku is not null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'pending',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  paypal_order_id text unique,
  paypal_capture_id text unique,
  delivery_steps jsonb not null default '[]',
  shipping_name text,
  shipping_street text,
  shipping_city text,
  shipping_postal_code text,
  shipping_country text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  shipping_cost_cents integer not null default 0 check (shipping_cost_cents >= 0)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

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
      when lower(coalesce(new.email, '')) = 'vascooliveirasilva@icloud.com' then 'admin'::public.user_role
      else 'customer'::public.user_role
    end,
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'vascooliveirasilva@icloud.com';

-- Security definer function: checks admin role without triggering RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

create policy "Anyone can read published products"
on public.products
for select
using (is_published = true or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Admins can manage products"
on public.products
for all
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Users can read own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "Admins can read all profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can manage own cart"
on public.cart_items
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can read own orders"
on public.orders
for select
using (
  user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Users can create own orders"
on public.orders
for insert
with check (user_id = auth.uid());

create policy "Admins can update orders"
on public.orders
for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "Users/admins can read order items"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
  )
);

create policy "Admins can manage order items"
on public.order_items
for all
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.reviews enable row level security;

-- Anyone can read reviews for published products
create policy "Anyone can read reviews"
on public.reviews
for select
using (
  exists (
    select 1 from public.products pr
    where pr.id = product_id
      and (pr.is_published = true or public.is_admin())
  )
);

-- TODO (pre-launch): tighten this policy to verified purchasers only.
-- Replace with a check that requires the user to have a paid/fulfilled order
-- containing this product_id before allowing the insert.
create policy "Users can insert own review"
on public.reviews
for insert
with check (user_id = auth.uid());

-- Users can delete their own review; admins can delete any
create policy "Users and admins can delete reviews"
on public.reviews
for delete
using (user_id = auth.uid() or public.is_admin());
