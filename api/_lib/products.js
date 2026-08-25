const PRODUCTS = {
  "dsa-decoder": {
    name: "The 40-Pattern DSA Decoder",
    amount_paise: 19900,
    anchor_paise: null,
    download_url: "/downloads/dsa-decoder.pdf"
  },
  "company-vault": {
    name: "Product Company Vault",
    amount_paise: 49900,
    anchor_paise: null,
    download_url: "/downloads/company-vault.pdf"
  },
  "system-design": {
    name: "System Design for Indian Product Companies",
    amount_paise: 49900,
    anchor_paise: null,
    download_url: "/downloads/system-design.pdf"
  },
  "offer-stack": {
    name: "The Offer Stack",
    amount_paise: 29900,
    anchor_paise: null,
    download_url: "/downloads/offer-stack.pdf"
  },
  "complete-system": {
    name: "The Complete Interview System",
    amount_paise: 129900,
    anchor_paise: 149700,
    download_url: "/downloads/complete-system.pdf"
  }
};

function publicCatalog() {
  return Object.entries(PRODUCTS).map(([sku, p]) => ({
    sku,
    name: p.name,
    amount: p.amount_paise,
    anchorPaise: p.anchor_paise
  }));
}

module.exports = { PRODUCTS, publicCatalog };
