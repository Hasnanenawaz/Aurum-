# Aurum — gives smile 🎁

A jewellery storefront for **Aurum** ([@aurum_givessmile](https://www.instagram.com/aurum_givessmile/)) with a built-in admin panel.

Customers browse, add pieces to a bag and check out — the order is saved and then handed to Aurum on **WhatsApp** to confirm payment and delivery. The admin can add and delete products, upload photos, run offer prices, manage users and track orders.

The look takes its *calm, airy luxury* cue from Tiffany & Co. (centred wordmark, thin category nav, generous white space, a service strip under the hero) but the identity is Aurum's own — colours sampled straight from the logo and a **gifting** story built around the gift box, ribbon and To/From tag in the badge.

---

## Quick start

You need **Node.js 18.18 or newer** (20 LTS recommended).

```bash
npm install
cp .env.example .env.local      # then open it and set JWT_SECRET + WhatsApp number
npm run dev
```

Open **http://localhost:3000** for the store.

### Admin login

Go to **http://localhost:3000/account** and sign in with:

| Email | Password |
|---|---|
| `admin@aurum.local` | `aurum-admin-123` |

(or whatever you set in `ADMIN_EMAIL` / `ADMIN_PASSWORD` **before the first run**). You'll land on **/admin**. Change this password before going live — see "Before launch" below.

The database is created automatically at `data/db.json` the first time the app starts, filled with 10 sample products and one festive offer.

---

## What's inside

### Storefront
| Page | What it does |
|---|---|
| `/` | Hero, service strip, shop-by-category, live offer band with countdown, most-gifted pieces, 3-step gift ritual, shop by occasion, Instagram, FAQ |
| `/shop` | All products, filter by category / occasion (`?tag=birthday`), search (`?q=`), sort |
| `/product/[slug]` | Gallery, live price with offer applied, quantity, add to bag, details, related pieces |
| `/bag` | Bag with live prices, delivery details, gift-tag note, place order → WhatsApp |
| `/account` | Sign in / create account; shows past orders; admins get a link to the panel |

### Admin panel (`/admin`)
| Section | What you can do |
|---|---|
| **Dashboard** | Revenue & orders this month, new orders waiting, live offers, low-stock alerts |
| **Products** | Add, edit, delete; upload photos (first = cover); set stock, sale price, occasions; toggle *featured* and *live/draft* right from the table |
| **Offers & prices** | % or ₹ off the whole store, chosen categories, or hand-picked products; start/end dates; pause/resume; choose whether it shows in the top banner; live price preview |
| **Orders** | Filter by status, move orders through *new → confirmed → packed → shipped → delivered*, see gift-tag note and address, tap the phone number to WhatsApp the customer. Cancelling puts stock back |
| **Users** | Search, promote to admin / demote to customer, pause or delete accounts. You can't lock yourself out or remove the last admin |

### How offer prices work
The customer always pays the **lowest** of: the regular price, the product's own sale price, or any **live** offer that covers it. Offers never stack. Prices are always recalculated on the server at checkout, so nobody can edit them in the browser. Logic lives in `lib/pricing.js` and is covered by `npm test`.

---

## Project structure

```
aurum/
├─ app/
│  ├─ (shop)/               Storefront pages (share header + footer)
│  │  ├─ page.js            Home
│  │  ├─ shop/              Listing
│  │  ├─ product/[slug]/    Product detail
│  │  ├─ bag/               Bag + checkout
│  │  └─ account/           Sign in / register / my orders
│  ├─ admin/                Admin panel (protected)
│  │  ├─ products/ offers/ orders/ users/
│  │  └─ layout.js          Re-checks admin role on every load
│  ├─ api/                  Backend (Next.js route handlers)
│  │  ├─ auth/              login, register, logout, me
│  │  ├─ products/          GET list, POST · GET/PATCH/DELETE by id
│  │  ├─ offers/            GET, POST · PATCH/DELETE by id
│  │  ├─ orders/            GET (admin), POST (checkout) · PATCH status
│  │  ├─ users/             GET · PATCH/DELETE by id
│  │  ├─ upload/            POST photo (admin)
│  │  ├─ uploads/[file]/    Serves uploaded photos
│  │  └─ stats/             Dashboard numbers
│  ├─ globals.css           The whole design system (tokens at the top)
│  └─ layout.js             Fonts, SEO metadata
├─ components/              Header, Footer, ProductCard, Price, AddToBag, Gallery, admin Drawer…
├─ lib/
│  ├─ db.js                 JSON-file database (read/write with a safe write queue)
│  ├─ seed.js               Sample data + first admin
│  ├─ pricing.js            Offer engine
│  ├─ validate.js           Input checks for every form
│  ├─ auth.js / session.js  JWT cookie sessions, requireAdmin()
│  ├─ uploads.js            Photo storage (data/uploads)
│  ├─ catalog.js            Categories, occasions, ₹ formatting
│  └─ brand.js              Instagram handle, WhatsApp number
├─ middleware.js            Keeps non-admins out of /admin
├─ public/brand/            Aurum logo files
├─ public/placeholders/     Line-art shown until real photos are uploaded
├─ data/                    db.json + uploads (created at runtime, git-ignored)
├─ tests/                   Pricing unit tests + end-to-end API check
└─ CLAUDE.md                Notes for Claude Code
```

---

## Scripts

| Command | |
|---|---|
| `npm run dev` | Start in development mode |
| `npm run build && npm start` | Production build + server |
| `npm test` | Pricing engine unit tests |
| `npm run test:api` | End-to-end API check (run while the server is up) |
| `npm run seed -- --yes` | **Erase** the database and reload sample data |

---

## Before launch — checklist

1. **Set `JWT_SECRET`** in `.env.local` to a long random string.
2. **Change the admin password** — easiest way: create your real account at `/account`, promote it to admin in **Users**, then delete the sample admin.
3. **Set `NEXT_PUBLIC_WHATSAPP_NUMBER`** (e.g. `919876543210`) so checkout opens WhatsApp.
4. **Replace placeholder content** — sample products, prices and the material line (*"18k gold-plated brass, anti-tarnish coating"*) are guesses. Also confirm the FAQ promises (packing in 1–2 days, delivery 3–7 days, handwritten tags) match how Aurum really works. FAQ text is in `app/(shop)/page.js`.
5. **Upload real product photos** (square, at least 1200×1200 looks best).
6. **Hosting:** this starter stores data in files, so host it somewhere with a persistent disk — a small VPS, Railway or Render with a volume (set `DATA_DIR` to the volume path). Serverless hosts like Vercel wipe files between requests; to use Vercel, move the database to Postgres/Supabase and photos to Cloudinary/Vercel Blob first (only `lib/db.js` and `lib/uploads.js` need to change).
7. **Back up** the `data/` folder regularly.

---

## Good next steps (ask Claude Code for any of these)

- Online payments with **Razorpay** (UPI/cards) instead of WhatsApp confirmation
- Move to **Postgres / Supabase** and **Cloudinary** for images
- Order confirmation emails, password reset
- Wishlist, product reviews, coupon codes
- Real product photography and Instagram feed embed

> Note: `npm audit` flags a PostCSS advisory inside Next.js 15's build tooling. It affects the build step, not the running site; it's fixed in Next 16, which you can upgrade to later.
