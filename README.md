# Beyond The Interviews — Affiliate Resource Hub

A fast, static, monetization-ready landing page for **beyondtheinterviews.com**.
Curated interview-prep resources (coding practice, system design, mock interviews, courses, books, resume tools) with affiliate-ready outbound links and an email-capture funnel.

## Stack

Plain HTML + CSS + JS. No build step. No dependencies. Deploys anywhere static files are served.

## Monetization built in

1. **Affiliate links** — every resource card links out with `rel="noopener sponsored"`.
2. **Email capture** — newsletter section wired for [Formspree](https://formspree.io).
3. **FTC-compliant affiliate disclosure** in the footer.

## Make it yours (2 required edits)

1. **Affiliate URLs** — edit the `RESOURCES` array at the top of `script.js`.
   Replace each `url` with your tracked affiliate link, e.g.
   `https://www.educative.io/explore?aff=YOUR_ID`.
   Recommended programs to join:
   - NeetCode — affiliate application on their site
   - Educative.io — partner program (PartnerStack)
   - ByteByteGo — affiliate program (their site footer)
   - Interviewing.io — partner program
   - Exponent — affiliate program (their site)
   - Amazon Associates — for the books (Cracking the Coding Interview, DDIA)
   - Coursera / Udemy — via Impact/Rakuten or their affiliate pages

2. **Newsletter form** — in `index.html`, replace `YOUR_FORM_ID` in the Formspree action URL with your real form ID. Until then the form shows a demo message instead of failing silently.

## Run locally

```bash
npx serve .        # or: python3 -m http.server 8000
```

Open http://localhost:8000 (or :3000 for serve).

## Deploy

- GitHub Pages is preconfigured via `.github/workflows/deploy.yml` — it deploys on every push to `main`.
- To use a custom domain later: add a `CNAME` file containing `beyondtheinterviews.com`, and point your DNS at GitHub Pages (A records / CNAME per https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Adding a resource

Append an object to `RESOURCES` in `script.js`:

```js
{
  name: "Resource Name",
  category: "Coding Practice", // any category; filter chips auto-generate
  tag: "paid",                 // free | paid | freemium
  tagLabel: "$$",
  blurb: "One honest sentence on who it's for.",
  url: "https://your-affiliate-link",
  featured: true               // optional: adds "Top pick" flag
}
```
