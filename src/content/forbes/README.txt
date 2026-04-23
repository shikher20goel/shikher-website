How to add a Forbes article to the /writing page
==================================================

1. Create a new file in this folder, named like:  2026-04-ai-at-scale.md
   (The filename only matters as an identifier — use the publish month and slug.)

2. Paste this template and fill it in:

   ---
   title: "The article title exactly as it appears on Forbes"
   url: "https://www.forbes.com/councils/forbestechcouncil/2026/04/.../full-url-here"
   pubDate: 2026-04-20
   excerpt: "A paragraph in YOUR OWN WORDS teasing what the article is about.
             Do NOT copy the Forbes intro text — you don't own that copyright.
             2-4 sentences is the sweet spot. Readers click out to Forbes for the rest."
   ---

3. Commit and push. Cloudflare Pages rebuilds automatically.

Why manual?
- Forbes blocks RSS/bot fetches for Contributor pages.
- Forbes Contributor agreements typically don't grant you re-publish rights,
  so we surface titles + your own teasers only, with a link out.
