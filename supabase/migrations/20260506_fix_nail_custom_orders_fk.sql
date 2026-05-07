-- Fix nail_custom_orders.user_id FK so PostgREST can join to profiles.
--
-- The original FK pointed to auth.users(id). PostgREST only follows direct
-- FK paths within the public schema — it cannot infer the transitive route
-- nail_custom_orders.user_id → auth.users.id ← profiles.id. This caused
-- the admin query (.select("*, profiles(...)")) to fail silently, returning
-- null data and showing "No orders found" in the admin panel.
--
-- profiles.id is 1:1 with auth.users.id (same UUID, FK with cascade), so
-- changing the reference target preserves all referential integrity guarantees.

alter table public.nail_custom_orders
  drop constraint nail_custom_orders_user_id_fkey;

alter table public.nail_custom_orders
  add constraint nail_custom_orders_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
