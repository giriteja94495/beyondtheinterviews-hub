# DEBATE_LOG — Beyond The Interviews v2 (Razorpay-first rebuild)

**Date:** 2026-08-25 · **Decision owner:** Giriteja · **Status:** DECIDED → build

---

## Context & mandate

v1 was an affiliate-links landing page. Owner verdict: materials were weak, affiliate model is
uncertain (approval risk, tracking IDs, commission dependency), and the direction is now:
**sell our own digital products directly, paid via Razorpay (INR/UPI)**, with best-in-class
execution. This log records the full multi-perspective debate that happened BEFORE any code.

Three independent specialist investigations ran in parallel (Round 1), then were
cross-examined against each other (Round 2), producing final decisions (Round 3).

---

## ROUND 1 — Specialist positions

### R1-A · Product & Monetization Strategist

**Market evidence (verified):**
- Digital interview-prep PDFs/templates sell on Topmate/Gumroad at ₹200–2,000.
  Sub-₹500 = impulse purchase; courses need brand trust first.
- Human mocks go for ₹1,500–5,000/session; flagship courses ~₹7,500 (InterviewReady benchmark).
- Brutal distribution reality: bottom 80% of Topmate creators earn <₹5,000/mo →
  differentiation + funnel matter more than listing products.

**Proposed lineup (free → paid ladder):**
| # | Product | Price | Role |
|---|---------|-------|------|
| 0 | "30-Day Final-Lap Interview Plan" | Free | Lead magnet (email capture) |
| 1 | The 40-Pattern DSA Decoder | ₹199 | Tripwire (zero-deliberation UPI buy) |
| 2 | Product Company Vault (company-wise Q-bank) | ₹499 | Core — India-specific moat |
| 3 | System Design for Indian Product Companies | ₹499 | Core |
| 4 | The Offer Stack (Resume+LinkedIn+Negotiation) | ₹299 | Core |
| 5 | The Complete Interview System (bundle) | ₹1,299 (anchor ₹1,497) | Premium |

**Funnel:** lead magnet → email → ₹199 tripwire → email sequence days 2–14 → bundle.

**Conversion rules:** testimonials beside Buy buttons (only once real ones exist);
ethical scarcity only (launch windows / expiring bonuses — never fake timers;
E-Commerce Rules 2020 treat manipulative patterns as actionable, CCPA fines up to ₹10L);
refund policy displayed at checkout RAISES conversion.

**Harsh self-critique:** piracy is immediate (Gaurav Sen's course leaked within weeks) →
watermark with buyer email, accept leakage, fight resale not sharing. Unknown solo brand =
trust deficit → give lead magnet away free for 2 weeks to harvest verifiable feedback
before charging >₹499. Razorpay settlement is T+2 (~2.36% effective fee incl. GST).
Solo bandwidth → launch ONE core product + tripwire first; validate ≥20 sales before building rest.

### R1-B · Curator (materials quality)

Previous list rejected as generic. Verified 2025–26 picks, India-weighted, stale options cut
(InterviewBit's Scaler funnel, GFG clutter, AlgoExpert vs free NeetCode):

- **DSA:** NeetCode 9.5/10 · Striver A2Z (takeUforward) 9/10 · LeetCode Premium 9/10
  ("buy ONE month when onsite is booked")
- **System Design:** Hello Interview 9/10 (best value; human mocks discontinued mid-2026)
  · System Design Primer 8.5/10 · Grokking SD (Design Gurus, lifetime ~$59) 7.5/10
- **Behavioral:** Tech Interview Handbook behavioral 9/10 (updated Apr 2026; scoring-rubric based)
- **Mocks:** Pramp 8/10 (free peer reps) · interviewing.io 8.5/10 (book 1–2 real-senior mocks,
  ~3 weeks pre-onside)
- **Resume/Apps:** TIH resume guide + free review portal 8.5/10 · Instahyre 8/10
  (product-company inbound > Naukri mass-apply)
- **Negotiation:** Levels.fyi 8.5/10 (+India pages) · AmbitionBox 8/10 (40L+ data,
  offer-letter decoder)

**Key curation principle adopted:** every blurb states WHO it's for and WHY it beats the
alternative. No link farms.

### R1-C · Payments Engineer (Razorpay, verified vs official docs Aug 2026)

- Standard Checkout via `https://checkout.razorpay.com/v1/checkout.js`; options require
  `key`, `amount` (**paise**), `currency:"INR"`, `order_id` from server-side Orders API;
  handler receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
- Orders API: `POST https://api.razorpay.com/v1/orders`, Basic auth `key_id:key_secret`,
  unique `receipt` ≤40 chars acts as idempotency key.
- Verification: `HMAC_SHA256(key_secret, order_id + "|" + payment_id)` hex digest,
  timing-safe compare. Use OUR stored order_id, never client-posted.
- Webhooks: `X-Razorpay-Signature` = HMAC-SHA256(**raw body**, webhook_secret); subscribe
  `payment.captured` (authoritative fulfilment), `payment.failed`, `order.paid`; dedupe on
  event/payment id; return 200 <5s, process async.
- Test mode: `rzp_test_…` keys; cards 4111 1111 1111 1111 / 5267 3181 8797 5449;
  UPI `success@razorpay` / `failure@razorpay`.
- **Client-side-only payments are insecure**: embedded key_secret = anyone can refund you;
  without server orders the amount is whatever the browser sends (pay ₹1 for a ₹499 product).
- Architecture ranking: (a) Payment Pages/Buttons no-code = fastest but no logic/delivery
  automation; **(b) static frontend + serverless functions = RECOMMENDED**; (c) full backend
  = unnecessary.
- Delivery: reveal downloads ONLY after server-side verification; prefer short-lived signed
  URLs later; deliver also to prefill.email via webhook (tab-close resilience).
- Compliance: PCI out of scope (hosted iframe); publish refund policy (E-Commerce Rules 2020);
  GST invoice thresholds — confirm with CA; Razorpay settlements ≠ invoices.

---

## ROUND 2 — Cross-examination (the actual debate)

**C1. Strategist vs Curator — "Do free resources cannibalize paid products?"**
- Curator: the free-resources section builds trust; every pick exposes a gap our products fill
  (e.g., NeetCode teaches patterns; our Vault adds company-specific frequency tagging).
- Strategist counter: don't put free list ABOVE products on the page — it becomes a
  links-page again (v1's failure mode).
- **Resolution:** page hierarchy = Products FIRST, free resources positioned as "start here
  if you can't pay yet" trust-builder below, plus lead magnet. Free section keeps zero
  monetization language (no affiliate disclosure anywhere).

**C2. Engineer vs Strategist — "GitHub Pages can't run payment APIs."**
- Engineer: order creation + verification MUST be server-side. GitHub Pages serves static
  files only.
- Options debated:
  - (i) Pure Razorpay Payment Buttons/Pages — rejected as primary: owner wants branded flow +
    automated delivery; kept as documented fallback.
  - (ii) Migrate whole site to Vercel — best long-term but changes hosting today.
  - (iii) **Hybrid chosen:** repo stays deployable to GitHub Pages as-is (showcase mode),
    AND includes `/api` serverless functions (Vercel-compatible, zero npm deps) so deploying
    to Vercel activates full payments. Frontend auto-detects API health and switches modes.
- **Resolution:** Option iii. Demo-mode banner when API absent. No secrets ever in frontend.

**C3. Engineer vs Curator — "Where do download files live?"**
- Curator: owner has no product files yet; hardcoding dead links looks broken.
- Engineer: delivery must be gated by server verify regardless.
- **Resolution:** PRODUCTS catalog lives in ONE shared module (`api/_lib/products.js`)
  consumed by both server (authoritative amounts — client price tampering impossible) and
  frontend (rendering). Download URLs are per-product config fields; placeholder until owner
  uploads real PDFs; demo mode clearly labeled until keys are set.

**C4. Strategist vs Engineer — "Pricing psychology vs implementation."**
- Strategist wants ₹1,299 anchor with struck-through ₹1,497.
- Engineer: amounts resolved server-side from SKU; display price and charged amount must come
  from same catalog or they WILL drift.
- **Resolution:** single source of truth catalog; strikethrough anchors are display metadata
  in the same object as `amount_paise`.

**C5. All — "What about fake scarcity/testimonials?"**
- Unanimous: none. No countdown timers, no invented quotes. Trust-building instead:
  founding-member framing, transparent refund policy (7-day, defect/duplicate/failed-delivery
  grounds), visible contact, UPI-first checkout messaging.

**C6. Curator challenge to Strategist lineup — "Five SKUs is too many for day one."**
- Strategist concedes partially but keeps all five rendered: bundle needs its components to
  exist to make sense. Build priority noted: Vault + Decoder first (owner action item).

---

## ROUND 3 — Final decisions (ADR-style)

| ID | Decision | Rationale |
|----|----------|-----------|
| ADR-01 | Drop affiliate model entirely; remove disclosure; resources become pure free content | Owner decision: approval/tracking uncertainty |
| ADR-02 | Sell own digital products; 5 SKUs per strategist lineup; INR pricing fixed | Market-verified price bands; India audience |
| ADR-03 | Razorpay Standard Checkout; UPI-first messaging | India conversion; hosted iframe keeps PCI out of scope |
| ADR-04 | Server-side order creation + HMAC verification + webhook listener; zero-npm-dep Node functions | Client-side-only is exploitable (amount tampering, secret leak) |
| ADR-05 | Hybrid hosting: GitHub Pages showcase mode + Vercel full-payments mode; runtime API-health detection | Keeps current live URL working today; one-command upgrade path |
| ADR-06 | Single catalog module drives prices/rendering/server validation | Prevents display/charge drift; blocks price tampering |
| ADR-07 | Downloads revealed only after server verification; demo mode until keys configured | Delivery integrity; honest UX while unconfigured |
| ADR-08 | No fake scarcity/testimonials; publish refund policy + contact | Legal safety (CPA 2019/E-Commerce Rules 2020) + unknown-brand trust building |
| ADR-09 | Curated resource list v2 (13 verified picks, WHO-it's-for blurbs), placed BELOW products | Fixes "materials are not good"; supports funnel without cannibalizing |
| ADR-10 | Lead magnet email capture stays (Formspree placeholder) | Funnel entry; works even in showcase mode |

## Consequences / open items for owner
1. Create Razorpay account → get `rzp_test_` keys → configure webhook secret → swap to live keys (README checklist).
2. Author product PDFs (Vault + Decoder first); set `download_url` per product.
3. Connect Formspree form ID for lead magnet.
4. Harvest 10 verifiable testimonials via free lead-magnet window before raising ad spend.
5. Later: watermark deliveries with buyer email via webhook automation; signed-URL CDN delivery.

---
*Every code file in this repo traces back to an ADR above.*
