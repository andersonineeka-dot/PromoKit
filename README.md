# PromoKit MVP

A working marketing-kit generator: fill in a business + offer, get a full
AI-generated campaign (captions, Reels, SMS, email, flyer copy, hashtags,
7-day plan), with a free-preview / unlock flow.

## What's in this folder

- `index.html` — the entire frontend (landing, form, results, unlocked kit)
- `functions/api/generate.js` — a Cloudflare Pages Function that calls the
  Anthropic API server-side, so your API key is never exposed in the browser

## Deploy (Cloudflare Pages, via GitHub — recommended)

Direct drag-and-drop upload does **not** reliably pick up the `functions`
folder, so use the Git method — it's still free and takes a few minutes.

1. Create a new GitHub repo and push this whole folder to it
   (`index.html`, `functions/`, `README.md`).
2. In Cloudflare: **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → select your repo.
3. Build settings: leave "Build command" empty, "Build output directory" = `/`
   (this is a static site with a function, no build step needed).
4. Before the first deploy finishes, go to **Settings → Environment
   variables** and add:
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com → mark it
     "Encrypt"
5. Click **Deploy**. Your app is live at `https://<project>.pages.dev`.

## Deploy (Wrangler CLI — alternative, no GitHub needed)

```
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=promokit
wrangler pages secret put ANTHROPIC_API_KEY --project-name=promokit
```
(paste your key when prompted, then redeploy so the function picks it up)

## Test locally before deploying

```
npx wrangler pages dev .
```
This runs the site AND the function on your machine, with your key loaded
from a `.dev.vars` file (create one with `ANTHROPIC_API_KEY=sk-ant-...` —
add `.dev.vars` to `.gitignore` so you never commit it).

## Before charging real money

- The "Unlock My PromoKit" button is a demo — it doesn't charge anyone.
  Swap it for Stripe Checkout before launch.
- Add basic rate limiting to `functions/api/generate.js` (e.g. Cloudflare
  Turnstile or a simple IP-based limit) so the endpoint can't be spammed
  and run up your API bill.
