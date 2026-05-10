alter table public.orders
  add column if not exists charged_currency text,
  add column if not exists charged_amount_cents integer;
