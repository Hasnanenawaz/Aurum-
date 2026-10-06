# CLAUDE.md — working notes for Claude Code

Aurum is a jewellery gifting brand (Instagram: @aurum_givessmile). This repo is a Next.js 15 (App Router, plain JavaScript, ESM) storefront + admin panel. Read README.md for the feature tour.

## Commands
- `npm run dev` — dev server on :3000
- `npm run build` — must pass before you say a change is done
- `npm test` — pricing unit tests (node:test, no extra deps)
- `npm run test:api` — end-to-end API check; needs a running server
- `npm run seed -- --yes` — reset data/db.json to sample data
- Admin login (dev): admin@aurum.local / aurum-admin-123

## Architecture rules
- **Data access goes through `lib/db.js` only** (`read()` returns a copy; `write(db => …)` mutates and saves atomically through a queue). Never `fs.writeFile` db.json elsewhere. If migrating to Postgres/Supabase, re-implement this module and keep the call sites.
- **Pricing lives in `lib/pricing.js`.** Never compute a discounted price in a component or route by hand — call `priceProduct()` / `withPricing()`. Checkout (`app/api/orders/route.js`) must always recompute prices server-side.
- **Every admin API route starts with `await requireAdmin()`** (from `lib/auth.js`), which re-reads the user from the DB. `middleware.js` only guards /admin pages by cookie and is not a security boundary on its own.
- **Validate all input** with a function in `lib/validate.js`; routes must only store the cleaned object it returns.
- Wrap route handlers in `route()` from `lib/http.js` and throw `HttpError(status, message, details)` for user-facing errors. `details` is a `{ field: message }` map the admin forms display under each input.
- Uploaded photos go to `data/uploads` and are served by `/api/uploads/[file]` (public/ isn't served for files added after build). Store only the URL on products.
- Next 15: `params` and `searchParams` are Promises — `await` them.

## Design system
- All styles are in `app/globals.css`; design tokens are CSS variables at the top. Reuse existing classes (`.btn`, `.btn-ghost`, `.section`, `.section-head`, `.eyebrow`, `.product-grid`, `.panel`, `.table`, `.status`, `.drawer`…) before adding new ones.
- Brand colours come from the logo: blush `#FFDBDD`, maroon `#8A3C43`, rose `#D4858A`, cream `#FCEDCC`. Don't introduce unrelated accent colours.
- Fonts: Cormorant Garamond (headings, wordmark), Parisienne (the "gives smile" script — use `.script` sparingly, one phrase per headline at most), Jost (body).
- Single primary CTA across the storefront is **"Find a gift"** (→ /shop); product pages use **"Add to bag"**; checkout ends on **"Send order on WhatsApp"**. Keep wording consistent.
- Mobile first: check new UI at 390px wide. Keep visible focus states; meaningful images need alt text; use `next/image` (see `components/ProductImage.js`).
- Copy should be specific to Aurum (gift box, ribbon, To/From tag, WhatsApp confirmation) — avoid generic jewellery-store phrases.

## Placeholders to confirm with the client
Sample products/prices, the material line, FAQ claims about shipping times and handwritten tags, and the WhatsApp number (env `NEXT_PUBLIC_WHATSAPP_NUMBER`).
