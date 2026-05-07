-- ============================================================
-- Fix: cart_items nail product support
-- Run this if 20260505_add_nails_tables.sql failed on cart_items.
-- All statements are safe to run even if partially applied.
-- ============================================================

-- 1. Make product_id nullable (idempotent in Postgres — no error if already nullable)
alter table public.cart_items
  alter column product_id drop not null;

-- 2. Add nail_product_id column (IF NOT EXISTS — safe to re-run)
alter table public.cart_items
  add column if not exists nail_product_id uuid references public.nail_products(id) on delete cascade;

-- 3. Add XOR check constraint (skip if already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart_items'::regclass
      and conname  = 'cart_items_one_product_type'
  ) then
    alter table public.cart_items
      add constraint cart_items_one_product_type check (
        (product_id is not null and nail_product_id is null) or
        (product_id is null     and nail_product_id is not null)
      );
  end if;
end $$;

-- 4. Add partial unique index for nail products in cart (IF NOT EXISTS — safe to re-run)
create unique index if not exists cart_items_user_nail_product_unique
  on public.cart_items (user_id, nail_product_id)
  where nail_product_id is not null;
