# Beyond The Interviews — Direct-sales store (Razorpay)

Static-first storefront selling interview-prep kits for INR via **Razorpay**, plus a curated
free-resources section. Design decisions and the full product debate are recorded in
[DEBATE_LOG.md](./DEBATE_LOG.md) — read that first.

## Architecture (ADR-04/05/06 summary)

```
Browser ──Buy──▶ /api/create-order ──▶ Razorpay Orders API   (amounts from shared catalog)
        ◀──order_id──┘
Browser ──checkout.js modal──▶ Razorpay (UPI/cards/netbanking/wallets)
        ──handler payload──▶ /api/verify-payment ──▶ HMAC verify + order re-fetch + amount check
        ◀──downloadUrl──┘
Razorpay ──webhook──▶ /api/webhook ──▶ raw-body HMAC verify ──▶ fulfilment hook (email backup)
```

- `api/_lib/products.js` is the single source of truth for SKUs/amounts/download URLs.
  The client can never dictate a price.
- Zero npm dependencies. Node 18+ (built-in fetch/crypto only).

## Two modes

| Mode | Where | Payments |
|------|-------|----------|
| Showcase | GitHub Pages (current) | Buy buttons explain setup; site is fully browsable |
| Live | Vercel/Netlify/any Node host with env vars | Full Razorpay checkout + verified delivery |

The frontend calls `/api/health` on load and switches automatically.

## Razorpay setup (go-live checklist)

1. Create an account at https://dashboard.razorpay.com → complete KYC.
2. **Test keys:** Settings → API Keys → Generate test keys (`rzp_test_…`).
3. Set env vars on your host:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` (create a webhook in Dashboard → Webhooks pointing at
     `https://YOUR-DOMAIN/api/webhook`, events: `payment.captured`, `payment.failed`, `order.paid`)
4. Deploy to **Vercel** (recommended): import the repo — `api/*.js` become serverless functions
   automatically; add the three env vars in project settings.
5. Test in sandbox: card `4111 1111 1111 1111` (any future expiry/CVV), UPI VPA
   `success@razorpay`. Failure paths: `failure@razorpay`.
6. Drop your real PDFs into `downloads/` (names must match `api/_lib/products.js`).
7. Swap in live keys (`rzp_live_…`) when ready.

## Local development

```bash
node --version            # need 18+
node local-server.mjs     # API on :3000
npx serve .               # static site on :3000 conflicts — use: npx serve -l 5500 .
# open http://localhost:5500 — it auto-detects the API on same origin? No:
```

For local testing with the API, serve everything through one origin:

```bash
RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx node local-server.mjs
curl http://localhost:3000/api/health
```

`local-server.mjs` serves the API routes only; point your static server's `/api` proxy at it,
or quickly smoke-test endpoints with curl:

```bash
curl http://localhost:3000/api/products
curl -X POST http://localhost:3000/api/create-order -H 'Content-Type: application/json' -d '{"sku":"dsa-decoder"}'
```

## Security model

- Order creation server-side only; client-supplied amounts are ignored by design.
- Payment verification = HMAC-SHA256(`order_id|payment_id`, key_secret) with timing-safe compare,
  THEN independent re-fetch of the order from Razorpay confirming `status=paid` and exact amount
  match against the catalog SKU.
- Webhooks verify HMAC over the **raw request bytes** with a dedicated webhook secret.
- Card data never touches this app (Razorpay-hosted iframe ⇒ out of PCI DSS scope).

## Owner action items

1. Author the five product PDFs (start with Vault + Decoder per DEBATE_LOG R2-C6).
2. Replace Formspree placeholder (`YOUR_FORM_ID` in index.html) to deliver the free lead magnet.
3. Add real refund-policy/terms/privacy page URLs (footer placeholders marked).
4. Wire `deliverBackupCopy()` in `api/_lib/handlers.js` to your email provider, deduped on event id.
5. Longer term: replace static `downloads/` files with signed URLs issued post-verification.

## Legacy deploy note

GitHub Pages workflow still deploys the static showcase on every push to `main`. The `api/`
folder is inert there (no secrets exist in code). For payments, use the Vercel deployment path
above and repoint the domain when ready.
