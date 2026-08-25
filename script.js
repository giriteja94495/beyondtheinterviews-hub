const RESOURCES = [
  {
    name: "LeetCode",
    category: "Coding Practice",
    tag: "freemium",
    tagLabel: "Free + Premium",
    blurb: "The industry-standard problem bank. Do Top Interview 150 first, then company-tagged sets in your final two weeks.",
    url: "https://leetcode.com",
    featured: true
  },
  {
    name: "NeetCode Pro",
    category: "Coding Practice",
    tag: "paid",
    tagLabel: "$$",
    blurb: "The clearest pattern-based roadmap in existence. 150 → 500 problems with video explanations that actually teach intuition.",
    url: "https://neetcode.io/pricing"
  },
  {
    name: "AlgoExpert",
    category: "Coding Practice",
    tag: "paid",
    tagLabel: "$$",
    blurb: "Polished video solutions and a built-in workspace. Best if you prefer guided, curriculum-style practice over raw grinding.",
    url: "https://www.algoexpert.io"
  },
  {
    name: "ByteByteGo",
    category: "System Design",
    tag: "freemium",
    tagLabel: "Free blog + Pro",
    blurb: "Alex Xu's visual system-design explainers. The fastest way to build mental models for scalable architecture.",
    url: "https://bytebytego.com",
    featured: true
  },
  {
    name: "Grokking Modern System Design (Educative)",
    category: "System Design",
    tag: "paid",
    tagLabel: "$$",
    blurb: "Interactive, text-based deep dives on the classic design questions: URL shortener, news feed, chat app, and friends.",
    url: "https://www.educative.io/explore"
  },
  {
    name: "System Design Primer",
    category: "System Design",
    tag: "free",
    tagLabel: "100% Free",
    blurb: "The legendary open-source GitHub repo. Dense, complete, and zero cost — pair it with whiteboard practice sessions.",
    url: "https://github.com/donnemartin/system-design-primer"
  },
  {
    name: "Interviewing.io",
    category: "Mock Interviews",
    tag: "freemium",
    tagLabel: "Free recordings + Paid mocks",
    blurb: "Anonymous mock interviews with engineers from FAANG-level companies, plus a library of real interview recordings.",
    url: "https://interviewing.io",
    featured: true
  },
  {
    name: "Pramp",
    category: "Mock Interviews",
    tag: "free",
    tagLabel: "Free peer mocks",
    blurb: "Peer-to-peer mock interviews with matching by role and schedule. The best free way to kill interview anxiety.",
    url: "https://www.pramp.com"
  },
  {
    name: "Tech Interview Handbook",
    category: "Resume & Behavioral",
    tag: "free",
    tagLabel: "100% Free",
    blurb: "Free end-to-end guide: resumes, behavioral prep (STAR method), algorithms study plans, and negotiation basics.",
    url: "https://www.techinterviewhandbook.org"
  },
  {
    name: "Exponent",
    category: "Resume & Behavioral",
    tag: "paid",
    tagLabel: "$$",
    blurb: "Best-in-class behavioral and product-sense prep, especially for PM, EM, and customer-facing engineering roles.",
    url: "https://www.tryexponent.com"
  },
  {
    name: "Cracking the Coding Interview",
    category: "Books",
    tag: "paid",
    tagLabel: "~$30",
    blurb: "The classic. Still the best single-volume tour of interview fundamentals — worth reading cover to cover once.",
    url: "https://www.amazon.com/s?k=cracking+the+coding+interview"
  },
  {
    name: "Designing Data-Intensive Applications",
    category: "Books",
    tag: "paid",
    tagLabel: "~$40",
    blurb: "The system-design bible. Read chapters 1–9 and you'll walk into any senior-level design round confident.",
    url: "https://www.amazon.com/s?k=designing+data-intensive+applications"
  },
  {
    name: "Udemy Interview Courses",
    category: "Courses",
    tag: "paid",
    tagLabel: "$10–20 on sale",
    blurb: "Never pay full price — sales run constantly. Solid picks for Java/Python interview bootcamps and system design crash courses.",
    url: "https://www.udemy.com/courses/search/?q=technical%20interview"
  },
  {
    name: "Coursera — Meta / Google Certificates",
    category: "Courses",
    tag: "freemium",
    tagLabel: "7-day free trial",
    blurb: "Structured programs from the companies themselves. Useful for resume signal and fundamentals if you're switching stacks.",
    url: "https://www.coursera.org"
  },
  {
    name: "Resume Worded",
    category: "Resume & Behavioral",
    tag: "freemium",
    tagLabel: "Free scan + Pro",
    blurb: "Instant ATS-style feedback on your resume and LinkedIn. Fix bullet points before you apply anywhere else.",
    url: "https://resumeworded.com"
  }
];

const CATEGORIES = ["All", ...new Set(RESOURCES.map(r => r.category))];

const grid = document.getElementById("resource-grid");
const filtersEl = document.getElementById("filters");
const emptyEl = document.getElementById("grid-empty");

function cardHTML(r) {
  return `
    <article class="card">
      ${r.featured ? '<span class="flag">Top pick</span>' : ""}
      <div class="card-top">
        <span class="card-cat">${r.category}</span>
        <span class="badge badge-${r.tag}">${r.tagLabel}</span>
      </div>
      <h3>${r.name}</h3>
      <p>${r.blurb}</p>
      <a class="card-cta" href="${r.url}" target="_blank" rel="noopener sponsored">Visit site ↗</a>
    </article>`;
}

function render(category) {
  const list = category === "All" ? RESOURCES : RESOURCES.filter(r => r.category === category);
  grid.innerHTML = list.map(cardHTML).join("");
  emptyEl.classList.toggle("hidden", list.length > 0);
}

CATEGORIES.forEach(cat => {
  const chip = document.createElement("button");
  chip.className = `chip${cat === "All" ? " active" : ""}`;
  chip.textContent = cat;
  chip.setAttribute("role", "tab");
  chip.addEventListener("click", () => {
    filtersEl.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    render(cat);
  });
  filtersEl.appendChild(chip);
});

render("All");

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
      "Demo mode: connect a Formspree form ID in index.html to collect signups.";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
