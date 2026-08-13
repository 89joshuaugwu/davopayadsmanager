# DavoPay Ads Manager

TikTok Ads Manager account hierarchy + financial record-keeping tool. Replaces manual
book-keeping of Gmail → Business Center → Ads Account records with automated funding,
spend, loss, and CPA tracking, plus PDF-ready reports.

## Hierarchy

```
Gmail Account (1)
 └─ TikTok Account + Manager Account (attributes on the Gmail record)
     └─ Business Centers (up to 3)
         └─ Ads Accounts (up to 3 each) → up to 9 ads accounts per Gmail
```

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Framer Motion + Lucide Icons
- Firebase Auth (Google Sign-In + Email/Password, whitelist-only — no public sign-up)
- Firebase Admin SDK for all data access (server-side only)
- Firestore for storage
- Cloudinary for report/document storage
- AES-256 (crypto-js) for reversible Gmail password encryption

## Security model

There is **no public sign-up**. Access is controlled by a `whitelisted_users` collection
in Firestore, keyed by email. Firestore security rules deny **all** direct client
read/write on every collection — every read and write goes through this app's API
routes, which verify the caller's Firebase ID token and confirm their email is
whitelisted before touching Firestore via the Admin SDK. This means:

- Gmail passwords are encrypted with `CRYPTO_SECRET_KEY` (server-only env var) before
  they ever reach Firestore, and only decrypted on-demand through
  `/api/gmail-accounts/[id]/reveal` — the secret key never ships to the browser.
- A new user can't grant themselves access by signing up; you must run the whitelist
  script (see below) or add their email manually in the Firebase Console.

## 1. Firebase setup

1. Create a Firebase project → enable **Authentication** → turn on **Google** and
   **Email/Password** sign-in providers.
2. Create a **Firestore** database (production mode).
3. Deploy the security rules in `firestore.rules`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at this project, keep firestore.rules as-is
   firebase deploy --only firestore:rules
   ```
   ⚠️ **Firestore rules changes must be published from the Firebase Console or CLI —
   this cannot be automated from within the app itself.**
4. Go to **Project Settings → Service Accounts → Generate new private key**. This gives
   you `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and
   `FIREBASE_ADMIN_PRIVATE_KEY` for `.env.local`.
5. Go to **Project Settings → General → Your apps → Web app** to get the
   `NEXT_PUBLIC_FIREBASE_*` client config values.

## 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in every value in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_*` — from the Firebase web app config
- `FIREBASE_ADMIN_*` — from the service account JSON (paste the private key with `\n`
  literal line breaks, wrapped in quotes)
- `CRYPTO_SECRET_KEY` — generate with `openssl rand -hex 32`
- `CLOUDINARY_*` — from your Cloudinary dashboard

## 3. Whitelist your email

Since there's no sign-up page, add yourself (and your bosses, if they need dashboard
access) to the whitelist before your first login:

```bash
npm install
node scripts/seed-whitelist.mjs joshuaugwu89@gmail.com boss@example.com
```

You can re-run this any time to add more emails.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` → redirects to `/login`.

## 5. Deploy to Vercel

```bash
vercel
```

Add every variable from `.env.local` to the Vercel project's Environment Variables
(Settings → Environment Variables) — for `FIREBASE_ADMIN_PRIVATE_KEY`, paste it exactly
as it appears in `.env.local` including the `\n` sequences.

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — DavoPay"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.env.local` is already gitignored — never commit real secrets.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Google Sign-In + Email/Password, whitelist-gated, no sign-up |
| `/dashboard` | Financial summary cards, search, and the Gmail → Business Center → Ads Account tree with full add/edit/delete, daily spend logging, and funding entries |
| `/analytics/business-centers` | Funding-over-time chart, per-BC totals bar chart, filterable funding history table, print/export |
| `/analytics/ads-accounts` | Multi-select filters (Gmail / Business Center / Ads Account / status, all checkbox-based) + date range, daily spend & CPA line chart, top-accounts bar chart, status breakdown pie chart, print/export |
| `/cards` | Card management — name, last 4 digits, optional link to one business center (or left flexible), and a running total of how much has been funded through each card |
| `/reports` | Date-filtered report table with Print/Export-to-PDF and a "save copy" to Cloudinary |

Navigation is a fixed left sidebar on desktop (lg breakpoint and up) and a slide-over
drawer behind a hamburger button on mobile — see `components/Sidebar.tsx`,
`components/MobileTopBar.tsx`, and `components/AppShell.tsx`.

Clicking the chart icon on any business center or ads account in the dashboard tree
jumps straight to the matching analytics page with that account pre-selected in the
filter panel (via `?businessCenterIds=` / `?adsAccountIds=` query params), so you don't
have to re-select filters you already know you want.

## Daily tracking & funding history

- **Daily ads logs** (`adsDailyLogs` collection): one entry per ads account per day —
  amount spent and cost-per-result for that day. Logging again for the same date
  updates that day's entry instead of creating a duplicate. Adding a log automatically
  keeps the ads account's `amountSpent` (running total) and `cpa`/status flag
  (from the most recent day logged) in sync — nothing else in the app needs to change.
- **Business center funding** (`businessCenterFunding` collection): one entry per
  top-up, with date and an optional note. Adding an entry automatically keeps the
  business center's `amountFunded` rollup in sync.
- Both are additive on top of the existing schema — older data created before this
  update still works exactly as before; the daily logs and funding entries are what
  power the analytics charts and time-series views specifically.

## Cards & expense tracking

- **Cards** (`cards` collection): name, last 4 digits only (never store full card
  numbers), an optional link to one business center, and active/inactive status.
- A card can be **dedicated** to one business center (always shows first in the "Card
  used" picker when funding that account) or **not linked**, meaning it's used flexibly
  to fund whichever account needs it.
- When recording a business center funding entry, you can optionally pick which card
  paid for it. The Cards page then shows a running total per card — how much has gone
  through it and how many top-ups — so you have expense visibility per card even for
  cards that fund multiple accounts.
- Deleting a card never deletes funding history: past entries keep their amount, date,
  and note, and just show "Card removed" where the card used to be referenced.

## Automated calculations

- **Total Funded** = sum of all Business Center `amountFunded`
- **Total Spent** = sum of all Ads Account `amountSpent`
- **Total Lost** = sum of `fundsLost` on Ads Accounts marked `blocked` or `closed`
- **Net Active Balance** = Total Funded − Total Spent − Total Lost
- **High-CPA flag** = any Ads Account with CPA > ₦100 gets a red "HIGH CPA — ACTION
  REQUIRED: PAUSE" badge, auto-written into `invalidationReason` on save

## Notes on scope

The original design brief mentioned a Tree View / Card View toggle. This build ships a
single expandable tree view (Gmail → Business Center → Ads Account, all inline) with
search-as-you-type across all three levels, which covers the same need with less UI to
maintain. A separate flat card view can be added later if you want it — the data layer
already supports it.
