-- ============================================================
-- Migration: add is_test_order flag to orders
-- Date: 2026-05-04
-- ============================================================

alter table public.orders
  add column if not exists is_test_order boolean not null default false;
