const FALLBACK_PRODUCTS = [
  {
    sku: "dsa-decoder",
    name: "The 40-Pattern DSA Decoder",
    tagline: "One map from pattern → problem → recognition cue. Stop re-solving blind.",
    bullets: ["40 patterns with when-to-use signals", "Curated LeetCode links per pattern", "Printable revision tracker"],
    price: "₹49", amount: 4900, anchor: null,
    downloadUrl: "/downloads/dsa-decoder.pdf",
    featured: false
  },
  {
    sku: "company-vault",
    name: "Product Company Vault",
    tagline: "~250 real questions from Flipkart, Swiggy, PhonePe, Razorpay-tier loops — tagged by pattern and frequency.",
    bullets: ["Company-wise frequency tags", "Solution sketches, not spoilers", "48-hour sprint plans per company"],
    price: "₹149", amount: 14900, anchor: null,
    downloadUrl: "/downloads/company-vault.pdf",
    featured: false
  },
  {
    sku: "system-design",
    name: "System Design for Indian Product Companies",
    tagline: "12 worked designs modeled on real India-loop questions — cart service, payment retries, delivery tracking.",
    bullets: ["45-minute answer framework", "Evaluation rubric used by interviewers", "HLD diagrams you can reproduce"],
    price: "₹149", amount: 14900, anchor: null,
    downloadUrl: "/downloads/system-design.pdf",
    featured: false
  },
  {
    sku: "offer-stack",
    name: "The Offer Stack",
    tagline: "Resume + LinkedIn + negotiation scripts tuned for Naukri/LinkedIn India and CTC-vs-ESOP reality.",
    bullets: ["ATS-ready resume templates", "Recruiter-screening checklist", "Fixed vs variable vs ESOP scripts"],
    price: "₹99", amount: 9900, anchor: null,
    downloadUrl: "/downloads/offer-stack.pdf",
    featured: false
  },
  {
    sku: "complete-system",
    name: "The Complete Interview System",
    tagline: "Every kit above, sequenced into one system from application to signed offer.",
    bullets: ["All four kits, one bundle", "12-week master schedule", "Lifetime updates included"],
    price: "₹299", amount: 29900, anchor: 44600,
    downloadUrl: "/downloads/complete-system.pdf",
    featured: true
  }
];

const RESOURCES = [
  { name: "NeetCode 150 + Roadmap", category: "DSA & Patterns", badge: "freemium", badgeLabel: "Free core · Pro optional", blurb: "The best structured on-ramp: 150 curated problems with a free video walkthrough for every one. Kills the 'what do I solve next?' paralysis.", url: "https://neetcode.io", rating: "9.5" },
  { name: "Striver A2Z DSA Sheet", category: "DSA & Patterns", badge: "free", badgeLabel: "Free sheet", blurb: "India's de-facto DSA bible — 474 problems, zero to advanced, ideal for a 4–6 month placement runway. Better topic ordering than Love Babbar's list.", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", rating: "9" },
  { name: "LeetCode (+ Premium)", category: "DSA & Patterns", badge: "freemium", badgeLabel: "Freemium", blurb: "The actual battleground. Company-tagged questions are the killer feature — buy ONE month when your onsite is booked, not earlier.", url: "https://leetcode.com", rating: "9" },
  { name: "Hello Interview", category: "System Design", badge: "freemium", badgeLabel: "Free breakdowns · Premium $79/yr", blurb: "Best value in system design right now: exceptional free breakdowns of real Meta/Google prompts plus guided practice. Human mocks discontinued mid-2026 — it's self-serve now.", url: "https://www.hellointerview.com", rating: "9" },
  { name: "System Design Primer", category: "System Design", badge: "free", badgeLabel: "100% Free", blurb: "335k-star canonical deep-dive with Anki decks and exercises. Denser than ByteByteGo but costs nothing — build fundamentals here first.", url: "https://github.com/donnemartin/system-design-primer", rating: "8.5" },
  { name: "Grokking SD Interview (Design Gurus)", category: "System Design", badge: "paid", badgeLabel: "~$59 lifetime", blurb: "One repeatable 45-minute framework across the classics. Pick this over subscriptions when your loop is weeks away and you want lifetime access cheap.", url: "https://www.designgurus.io/course/grokking-the-system-design-interview", rating: "7.5" },
  { name: "TIH Behavioral Guide", category: "Behavioral", badge: "free", badgeLabel: "100% Free", blurb: "Ex-Meta staff engineer + hiring-committee chair explain how behavioral answers are actually scored. Critical as AI takes over coding rounds.", url: "https://www.techinterviewhandbook.org/behavioral-interview", rating: "9" },
  { name: "Pramp", category: "Mock Interviews", badge: "free", badgeLabel: "Free peer mocks", blurb: "Real 60-minute peer sessions with rubrics across coding/SD/behavioral. Peer calibration is imperfect — treat as volume reps before expert mocks.", url: "https://www.pramp.com", rating: "8" },
  { name: "interviewing.io", category: "Mock Interviews", badge: "freemium", badgeLabel: "Free library · mocks $179+", blurb: "Anonymous voice mocks with senior FAANG engineers, plus a free library of recorded real interviews worth studying alone. Book 1–2, three weeks pre-onsite.", url: "https://interviewing.io", rating: "8.5" },
  { name: "TIH Resume Guide + Review Portal", category: "Resume & Applications", badge: "free", badgeLabel: "100% Free", blurb: "ATS-proof structure plus a free peer-review portal run by the Blind 75 author. Beats paid template sellers because the methodology is recruiter-tested.", url: "https://www.techinterviewhandbook.org/resume", rating: "8.5" },
  { name: "Instahyre", category: "Resume & Applications", badge: "free", badgeLabel: "Free for candidates", blurb: "Curated matching where Flipkart/CRED/Razorpay-tier recruiters reach out directly. Higher signal than mass-applying on job boards.", url: "https://www.instahyre.com", rating: "8" },
  { name: "Levels.fyi", category: "Negotiation", badge: "freemium", badgeLabel: "Free data", blurb: "Ground truth for total comp, India pages included. Never negotiate against CTC without level- and company-filtered numbers.", url: "https://www.levels.fyi", rating: "8.5" },
  { name: "AmbitionBox", category: "Negotiation", badge: "free", badgeLabel: "Free", blurb: "Naukri-owned reality check: salary data, interview experiences, and an offer-letter tool that decodes fixed vs variable CTC for Indian offers.", url: "https://www.ambitionbox.com", rating: "8" }
];

const API_BASE = "";
const state = { apiAvailable: false, razorpayConfigured: false, products: FALLBACK_PRODUCTS };

async function init() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { headers: { accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      state.apiAvailable = true;
      state.razorpayConfigured = !!data.razorpayConfigured;
    }
  } catch (e) {}
  const liveMode = state.apiAvailable && state.razorpayConfigured;
  document.getElementById("mode-banner").classList.toggle("hidden", liveMode);
  if (state.apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length) {
          state.products = mergeProducts(data.products);
        }
      }
    } catch (e) {}
  }
  renderProducts();
}

function mergeProducts(serverProducts) {
  return serverProducts.map(sp => {
    const local = FALLBACK_PRODUCTS.find(f => f.sku === sp.sku) || {};
    return {
      ...local,
      ...sp,
      price: `₹${(sp.amount / 100).toLocaleString("en-IN")}`,
      anchor: sp.anchorPaise || null
    };
  });
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = state.products
    .map(p => {
      const anchorHTML =
        p.anchor && p.anchor > p.amount
          ? `<span class="anchor">₹${Math.round(p.anchor / 100).toLocaleString("en-IN")}</span>`
          : "";
      const savePct =
        p.anchor && p.anchor > p.amount ? Math.round(((p.anchor - p.amount) / p.anchor) * 100) : null;
      return `
      <article class="card product-card${p.featured ? " featured" : ""}">
        ${p.featured ? '<span class="flag">Best value</span>' : ""}
        <h3>${p.name}</h3>
        <p class="tagline">${p.tagline}</p>
        <ul class="bullets">${(p.bullets || []).map(b => `<li>${b}</li>`).join("")}</ul>
        <div class="price-row">
          <span class="price">${p.price}</span>
          ${anchorHTML}
          ${savePct ? `<span class="save-pill">Save ${savePct}%</span>` : ""}
        </div>
        <button class="btn btn-primary buy-btn" data-sku="${p.sku}" data-name="${p.name}">Buy now</button>
        <p class="pay-note">UPI · Cards · NetBanking · Wallets</p>
      </article>`;
    })
    .join("");
  grid.querySelectorAll(".buy-btn").forEach(btn =>
    btn.addEventListener("click", () => buy(btn.dataset.sku, btn.dataset.name))
  );
}

let checkoutPromise = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutPromise) {
    checkoutPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
      document.head.appendChild(s);
    });
  }
  return checkoutPromise;
}

async function buy(sku, name) {
  if (!state.apiAvailable || !state.razorpayConfigured) {
    showModal(
      "Checkout not live yet — try the demo",
      `<p>Live payments activate once Razorpay keys are configured. Meanwhile, preview the exact post-payment experience:</p>
       <button class="btn btn-primary" id="demo-pay-btn" style="width:100%">Simulate successful payment (demo)</button>
       <p class="modal-small" style="margin-top:10px">Owner: add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> env vars and deploy with the <code>api/</code> folder enabled (see README). Test keys work too.</p>`
    );
    document.getElementById("demo-pay-btn").addEventListener("click", () => simulateSuccess(sku));
    return;
  }
  try {
    await loadCheckout();
  } catch (e) {
    showModal("Payment gateway unavailable", "<p>Could not reach Razorpay. Check your connection and retry.</p>");
    return;
  }
  let order;
  try {
    const res = await fetch(`${API_BASE}/api/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order creation failed");
    order = data;
  } catch (e) {
    showModal("Could not start checkout", `<p>${e.message}. Please retry in a moment.</p>`);
    return;
  }
  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: "Beyond The Interviews",
    description: name,
    order_id: order.orderId,
    theme: { color: "#2563eb" },
    handler: resp => verifyAndDeliver(sku, resp),
    modal: { ondismiss: () => {} }
  });
  rzp.on("payment.failed", () =>
    showModal("Payment failed", "<p>Your bank declined the payment. No money was captured — you can retry safely.</p>")
  );
  rzp.open();
}

function simulateSuccess(sku) {
  const product = state.products.find(p => p.sku === sku);
  if (!product) return;
  showModal(
    "Payment verified 🎉 (demo)",
    `<p><strong>${product.name}</strong> is yours.</p>
     <a class="btn btn-primary modal-download" href="${product.downloadUrl || "#"}" download>Download your files</a>
     <p class="modal-small">This is the exact screen real buyers see after Razorpay verification. The PDF is a sample placeholder — swap in your real files in <code>downloads/</code>.</p>`
  );
}

async function verifyAndDeliver(sku, resp) {
  let ok = false;
  let payload = null;
  try {
    const res = await fetch(`${API_BASE}/api/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...resp, sku })
    });
    payload = await res.json();
    ok = res.ok && payload.valid;
  } catch (e) {}
  if (ok && payload.downloadUrl) {
    showModal(
      "Payment verified 🎉",
      `<p><strong>${payload.productName}</strong> is yours.</p>
       <a class="btn btn-primary modal-download" href="${payload.downloadUrl}" download>Download your files</a>
       <p class="modal-small">Keep this tab open until your download completes. Trouble? Email support@beyondtheinterviews.com with your payment ID <code>${resp.razorpay_payment_id}</code>.</p>`
    );
  } else {
    showModal(
      "Almost there — verification pending",
      `<p>Your payment went through but automatic verification didn't complete (you may have closed the tab early, or verification timed out).</p>
       <p class="modal-small">Email support@beyondtheinterviews.com with payment ID <code>${resp.razorpay_payment_id}</code> and we'll deliver manually within hours. Your money is safe either way.</p>`
    );
  }
}

const RES_CATEGORIES = ["All", ...new Set(RESOURCES.map(r => r.category))];
const grid = document.getElementById("resource-grid");
const filtersEl = document.getElementById("filters");

function cardHTML(r) {
  return `
    <article class="card">
      <div class="card-top">
        <span class="card-cat">${r.category}</span>
        <span class="badge badge-${r.badge}">${r.badgeLabel}</span>
      </div>
      <h3>${r.name} <span class="rating" title="Editor strength rating">★ ${r.rating}</span></h3>
      <p>${r.blurb}</p>
      <a class="card-cta" href="${r.url}" target="_blank" rel="noopener">Open resource ↗</a>
    </article>`;
}

function renderResources(category) {
  const list = category === "All" ? RESOURCES : RESOURCES.filter(r => r.category === category);
  grid.innerHTML = list.map(cardHTML).join("");
  document.getElementById("grid-empty").classList.toggle("hidden", list.length > 0);
}

RES_CATEGORIES.forEach(cat => {
  const chip = document.createElement("button");
  chip.className = `chip${cat === "All" ? " active" : ""}`;
  chip.textContent = cat;
  chip.setAttribute("role", "tab");
  chip.addEventListener("click", () => {
    filtersEl.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderResources(cat);
  });
  filtersEl.appendChild(chip);
});
renderResources("All");

document.getElementById("theme-toggle").addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("bti.theme", isDark ? "dark" : "light");
  } catch (e) {}
});

const form = document.getElementById("newsletter-form");
form.addEventListener("submit", e => {
  if (form.action.includes("YOUR_FORM_ID")) {
    e.preventDefault();
    document.getElementById("newsletter-note").textContent =
      "Demo mode: connect a Formspree form ID in index.html to deliver the free plan.";
  }
});

const backdrop = document.getElementById("modal-backdrop");
function showModal(title, bodyHTML) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  backdrop.style.display = "flex";
}
function closeModal() {
  backdrop.style.display = "none";
}
document.getElementById("modal-close").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

document.getElementById("year").textContent = new Date().getFullYear();
init();
