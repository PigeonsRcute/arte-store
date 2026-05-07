-- Replace the nail finish vocabulary with four top-coat options.
-- Applies to nail_products (has a CHECK constraint).
-- nail_custom_orders.finish has no CHECK, so only data migration is needed there.

-- 1. Drop existing CHECK on nail_products.finish
ALTER TABLE public.nail_products
  DROP CONSTRAINT IF EXISTS nail_products_finish_check;

-- 2. Migrate existing nail_products rows to nearest equivalent
UPDATE public.nail_products SET finish = 'glossy_top_coat'   WHERE finish = 'glossy';
UPDATE public.nail_products SET finish = 'matte_top_coat'    WHERE finish = 'matte';
UPDATE public.nail_products SET finish = 'glittery_top_coat' WHERE finish IN ('chrome', 'holographic');
UPDATE public.nail_products SET finish = 'silvery_top_coat'  WHERE finish = 'velvet';

-- 3. Add new CHECK constraint
ALTER TABLE public.nail_products
  ADD CONSTRAINT nail_products_finish_check
  CHECK (finish IN ('glossy_top_coat', 'matte_top_coat', 'glittery_top_coat', 'silvery_top_coat'));

-- 4. Migrate nail_custom_orders (no constraint, just data)
UPDATE public.nail_custom_orders SET finish = 'glossy_top_coat'   WHERE finish = 'glossy';
UPDATE public.nail_custom_orders SET finish = 'matte_top_coat'    WHERE finish = 'matte';
UPDATE public.nail_custom_orders SET finish = 'glittery_top_coat' WHERE finish IN ('chrome', 'holographic');
UPDATE public.nail_custom_orders SET finish = 'silvery_top_coat'  WHERE finish = 'velvet';
