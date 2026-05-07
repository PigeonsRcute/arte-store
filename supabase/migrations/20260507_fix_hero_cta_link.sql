-- Fix hero CTA link to match the "Explore the Gallery" button text.
-- The original seed used /shop (mismatch), and ON CONFLICT DO NOTHING
-- means any admin edit to a bad path persisted. This corrects it.
update public.homepage_content
set content = content || '{"cta_link": "/gallery"}'::jsonb
where section = 'hero';
