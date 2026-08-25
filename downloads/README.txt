Drop your product PDFs here:

- dsa-decoder.pdf        → The 40-Pattern DSA Decoder (₹199)
- company-vault.pdf      → Product Company Vault (₹499)
- system-design.pdf      → System Design for Indian Product Companies (₹499)
- offer-stack.pdf        → The Offer Stack (₹299)
- complete-system.pdf    → The Complete Interview System bundle (₹1,299)

File names must match the `download_url` values in api/_lib/products.js.
Until real files exist, buyers in live mode would hit a 404 — keep the site
in showcase mode (no keys configured) until your PDFs are ready.

Recommended next step for stronger protection:
serve downloads via short-lived signed URLs (S3/R2 presigned) instead of static
files, issued by the verify-payment handler after signature verification.
