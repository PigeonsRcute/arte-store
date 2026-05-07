# Todo

---

## Phase 1 — Product Detail Page
- [x] Dynamic route `/products/[slug]` for each artwork
- [x] Image gallery (multiple images) — `ProductGallery` component
- [x] Title, description, price, category, dimensions, edition size
- [x] Quantity selector — `QuantitySelector` component
- [x] Add to cart button (disabled placeholder — Phase 2)
- [x] Reviews section (display only — Phase 4 for submission)
- [x] Admin: Edit button links to `/admin/products`
- [ ] Run Supabase migration (dimensions, edition_size, reviews table)

---

## Phase 2 — Cart & Customer Sign Up
- [x] Add to cart from gallery (ProductCard) and product detail page (ProductActions)
- [x] Cart page: items, quantities, update/remove, subtotal, total
- [x] Sign up form: full name + shipping address fields (customer only)
- [x] Address saved to Supabase `profiles` table on sign up
- [x] Admin: Customers list with name, email, city, country, order count
- [x] Admin: Customer detail page with full address + order history
- [ ] Run Supabase migration (profiles address columns + RLS update policy)

---

## Phase 3 — Checkout & Orders
- [ ] Checkout page: review order, confirm shipping address, place order
- [ ] Stripe payment integration
- [ ] Order confirmation page
- [ ] Customer: order history page (past orders, status, items)
- [ ] Admin: Orders list (customer name, email, address, items, quantities, total)
- [ ] Admin: Update order status (pending → processing → shipped → delivered)
- [ ] Admin: Update delivery timeline / steps per order

---

## Phase 4 — Reviews
- [ ] Customer: leave a review on product page (rating + comment)
- [ ] Only customers who purchased the product can review
- [ ] Admin: moderate / delete reviews

---

## Admin Panel (remaining)
- [x] Auth protection + `/admin` layout with sidebar
- [x] Artworks CRUD (add / edit / delete)
- [ ] Site content editor (hero, banners, featured artworks)
- [ ] Orders management (view, update status) — Phase 3
- [ ] Customers list — Phase 2
- [ ] Dashboard stats (revenue, sales, visitors)
- [ ] Team / user role management (invite, assign roles)

---

## Public Pages
- [ ] About page
- [ ] Contact page
- [ ] Artist Profile page

---

## Supabase
- [ ] Finalize all tables (profiles, cart_items, orders, order_items, reviews)
- [ ] RLS policies for all tables
- [x] Storage bucket for artwork images
- [x] Storage RLS policies

---

## Pre-launch
- [ ] SEO meta tags on all public pages
- [ ] Google Analytics setup
- [ ] Performance audit (images, load time)
- [ ] Deploy to Vercel

---

## Done
- [x] Project setup in Cursor
- [x] Next.js + Tailwind configured
- [x] Supabase project created
- [x] frontend-design skill installed
- [x] CLAUDE.md created
- [x] tasks/ folder set up
- [x] Admin layout + sidebar
- [x] Artworks CRUD with image upload
- [x] Admin auth + sign out fix