# Shikher Goel — Personal Blog + Portfolio

Built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com). Includes a Claude-powered chatbot backed by a Cloudflare Pages Function.

## Stack

- **Astro 6** — static-site generator, Markdown + MDX blog posts
- **Cloudflare Pages** — hosting (free tier) + global CDN + automatic HTTPS
- **Cloudflare Pages Functions** — serverless `/api/chat` endpoint (Workers runtime)
- **Anthropic SDK** — Claude Haiku 4.5 with prompt caching

## Project structure

```
src/
  components/     BaseHead, Header, Footer, Chatbot, etc.
  content/blog/   Markdown/MDX blog posts
  layouts/        BlogPost.astro
  pages/          index, about, projects, contact, blog/[id]
  consts.ts       Site title, author, social URLs — edit here first
functions/
  api/chat.js     Cloudflare Pages Function for the chatbot
public/
  _headers        Security + caching headers for Cloudflare
  robots.txt
```

## Local development

```bash
npm install
cp .env.example .env     # add your ANTHROPIC_API_KEY
npm run dev              # http://localhost:4321
```

> The chatbot API (`/api/chat`) runs as a Cloudflare Pages Function and does **not** work in `npm run dev`. To test it locally, use Wrangler:
>
> ```bash
> npm install -g wrangler
> npm run build
> wrangler pages dev dist
> ```
>
> Without the API, the chatbot silently falls back to keyword-matching answers — safe, just less smart.

## Writing a blog post

Create a Markdown or MDX file under `src/content/blog/`:

```markdown
---
title: "My first post"
description: "A short description for previews and SEO."
pubDate: 2026-04-20
---

Your content here...
```

Push to `main` and Cloudflare Pages rebuilds automatically.

## Deploy to Cloudflare Pages

### One-time setup

1. **Push this repo to GitHub.**
2. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.**
3. **Build settings:**
   - Framework preset: *Astro*
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22` (in Environment variables → `NODE_VERSION=22`)
4. **Environment variables → Production + Preview:**
   - `ANTHROPIC_API_KEY` = your key (mark as secret / encrypted)
5. **Save and deploy.** First build takes ~2 minutes.
6. **Update `src/consts.ts` GITHUB_URL / LINKEDIN_URL** to your real profiles.
7. **Update `astro.config.mjs` `site:`** to your final URL (e.g. `https://shikher.pages.dev` or your custom domain).
8. **Update `public/robots.txt`** sitemap URL to match.

### Custom domain

Cloudflare dashboard → your Pages project → **Custom domains → Set up a custom domain.** HTTPS is automatic. If the domain is registered at Cloudflare Registrar (~$10/yr at-cost), DNS is already pointed.

## Security

Set by default via `public/_headers`:

- **HSTS** with `includeSubDomains; preload` (1 year)
- **CSP** restricting scripts to same-origin, images/fonts to safe sources
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` + `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling unused browser features
- Long-lived immutable cache for hashed `_astro/*` assets; `no-store` for `/api/*`

Chatbot API (`functions/api/chat.js`) also enforces:

- Message count + length caps (prevents runaway cost / abuse)
- Role whitelist (`user` / `assistant` only)
- Generic error messages to clients; full error details only in Worker logs
- Same-origin only (no CORS headers = other sites can't use your key)

On top of this, Cloudflare provides **free DDoS protection, bot management, and a basic WAF** on the Pages project automatically.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Astro dev server at `localhost:4321` |
| `npm run build` | Build production site to `dist/` |
| `npm run preview` | Preview built site locally |
| `wrangler pages dev dist` | Run with Pages Functions locally |

## Legacy files

The pre-Astro scaffold is preserved in `_legacy/` for reference. Delete it once you're comfortable with the new setup (it's already gitignored).
