# Atelier Art Store (Full-Stack Starter)

Modern e-commerce starter built with:

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres + RLS)

## What is Included

- Customer-facing routes: `/`, `/shop`, `/cart`, `/account`
- Admin routes: `/admin`, `/admin/products`, `/admin/orders`
- Role check helper for admin-only screens
- Supabase SSR client setup (`server`, `client`, `middleware`)
- SQL schema + role-based policies in `supabase/schema.sql`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add your Supabase project values to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Run the SQL in Supabase:

- Open Supabase SQL Editor.
- Execute `supabase/schema.sql`.

5. Start development:

```bash
npm run dev
```

## Database Model

- `profiles`: extends `auth.users` with `role` (`customer` or `admin`)
- `products`: catalog of artworks
- `orders`: order header with status + totals
- `order_items`: line items linked to orders
- `cart_items`: active customer cart

## Next Steps

- Add auth forms on `/account` (email/password or OAuth)
- Add cart mutations + checkout API
- Add product create/update forms for admins
- Connect Stripe or your preferred payment provider
