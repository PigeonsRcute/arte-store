# CLAUDE.md — Art Store Project

## Project Overview
Personal art store website to sell original artwork online. The catalog includes digital art, prints, 2D animations, and mixed media.

## Tech Stack
- **Framework:** Next.js (App Router preferred)
- **Styling:** Tailwind CSS
- **Backend / DB:** Supabase (auth, database, storage)
- **Payments:** Not yet integrated — leave hooks/placeholders where relevant
- **Deployment:** Not yet configured — target is likely Vercel (Next.js default)

## Pages & Status

### Public
| Page | Status |
|---|---|
| Home | In progress |
| Gallery / Shop | In progress |
| Cart / Checkout | In progress |
| About | Planned |
| Contact | Planned |
| Artist Profile | Planned |
| Blog | Not planned |

### Admin (`/admin/*`)
| Page | Status |
|---|---|
| Dashboard (stats overview) | Planned |
| Artworks CRUD | Planned |
| Orders management | Planned |
| Customers list | Planned |
| Site Content editor | Planned |
| Team / Users & roles | Planned |

## Design System
- **Library:** Tailwind CSS — use utility classes, avoid inline styles
- **Aesthetic:** Bold and colorful — vibrant colors, strong visual presence, art-forward layouts
- **Responsiveness:** Desktop-first. Mobile should not break, but desktop is the primary target
- **Images:** Art pieces should be displayed at high quality — avoid aggressive compression
- **Animations:** Support 2D animation previews where relevant (video or GIF embeds)

## Language
- English only for now
- Do not set up i18n or locale routing — keep it simple until bilingual is explicitly requested

## Supabase Conventions
- Use the Supabase client from `@/lib/supabase` (or wherever it is initialized — check existing code)
- Tables follow snake_case naming (e.g., `art_pieces`, `cart_items`)
- Auth: use Supabase Auth for any user-related features
- Storage: use Supabase Storage for artwork images and animation files
- Never expose the service role key client-side

## Code Conventions
- **Language:** TypeScript preferred — add types where missing
- **Components:** Functional components only, no class components
- **File naming:** kebab-case for files, PascalCase for components
- **Imports:** Use `@/` path aliases, avoid relative `../../` chains
- **State:** Prefer React state and context before reaching for external libraries
- Refactoring existing Cursor code is allowed and encouraged when it improves clarity or structure

## Payments (Future)
- Stripe is the likely integration — leave payment-related logic in clearly labeled placeholder files or TODOs
- Do not hardcode prices — all pricing should come from Supabase

## Testing
- No test suite currently — do not generate test files unless explicitly asked
- Prioritize working, clean code over test coverage for now

## Task Management
- Track ongoing work in `tasks/todo.md`
- After any correction or lesson learned, add a rule to `tasks/lessons.md`
- Never mark a task complete without verifying it works in the browser

## Admin Panel

### Access & Auth
- Route: `/admin` — protected by Supabase Auth middleware in Next.js
- Only authenticated users with an admin role can access any `/admin/*` route
- Role checks must be done server-side in Next.js middleware — never rely on client-side only
- Image/file uploads go to a private Supabase Storage bucket

### Roles & Permissions
Roles are stored as a `role` field in the Supabase `profiles` table. The owner defines roles manually per user from the admin UI.

| Role | Access |
|---|---|
| `owner` | Full access to everything |
| `editor` | Artworks + site content only |
| `support` | Orders + customers, read-only elsewhere |
| `viewer` | Dashboard stats only |

Roles are flexible — new ones can be added. Always check the user's role server-side before any sensitive operation.

### Artwork Fields
Each artwork in Supabase must have: `title`, `description`, `price`, `category`, `tags`, `dimensions`, `edition_size`, `availability` (available/sold), `images` (array of Supabase Storage URLs), `created_at`.

### Site Content Editor
- Editable fields stored in a `site_content` Supabase table (key-value structure)
- Covers: hero headline, hero subheadline, CTA text, banners (image + text), featured artwork IDs
- Changes reflect immediately on the public site — no redeploy needed

### Admin Build Order
Build in this sequence — each unblocks the next:
1. Auth protection + `/admin` layout with sidebar navigation
2. Artworks CRUD (unblocks the public gallery)
3. Site content editor (unblocks homepage control)
4. Orders management (needed once payments are added)
5. Customers page
6. Dashboard stats
7. Team / user role management

## Claude Behavior Rules
1. **Plan before building** — for any task with 3+ steps, write a brief plan and confirm before coding
2. **Make changes minimal and focused** — only touch what's necessary for the task
3. **No band-aid fixes** — find root causes, not workarounds
4. **Ask before adding new dependencies** — check if something already in the stack can do the job
5. **Always check existing patterns** — scan the codebase before inventing a new convention