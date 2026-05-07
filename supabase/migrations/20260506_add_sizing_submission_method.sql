-- Add method and photo_urls to nail_sizing_submissions.
-- method: 'physical' (kit dropdowns) or 'photo' (finger photos).
-- photo_urls: ordered array of storage URLs, one per finger (empty string = no photo).
-- sizes gets a default of '{}' so photo submissions can omit it.

ALTER TABLE public.nail_sizing_submissions
  ADD COLUMN method     text     NOT NULL DEFAULT 'physical'
    CHECK (method IN ('physical', 'photo')),
  ADD COLUMN photo_urls text[]   NOT NULL DEFAULT '{}';

ALTER TABLE public.nail_sizing_submissions
  ALTER COLUMN sizes SET DEFAULT '{}';
