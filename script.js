window.__ready = true;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Navigation: solid bar on scroll, active section, mobile menu ---------- */
const nav = $("#nav"), menuBtn = $("#menu-btn"), links = $("#nav-links");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 10);
addEventListener("scroll", onScroll, { passive: true });
requestAnimationFrame(onScroll);

function setMenu(open) {
  links.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("open")));
links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const navLinks = $$(".nav-links a");
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.hash === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => sectionObserver.observe(s));

/* ---------- Soft spotlight that follows the mouse across glass panels ---------- */
for (const el of $$(".card, .tile, .contact-card")) {
  el.classList.add("spot");
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------- Bento: live Canterbury clock ---------- */
const clock = $("#clock");
if (clock) {
  const tick = () => {
    const now = new Date(), opts = { timeZone: "Europe/London" };
    clock.textContent = now.toLocaleTimeString("en-GB", { ...opts, hour: "2-digit", minute: "2-digit" });
    const hour = Number(now.toLocaleString("en-GB", { ...opts, hour: "2-digit", hour12: false }));
    $("#clock-note").textContent = hour >= 7 && hour < 22 ? "daytime here · replies within a day" : "night-time here · replies within a day";
  };
  tick();
  setInterval(tick, 30_000);
}

/* ---------- Projects: filter the "More projects" grid ---------- */
const filterBtns = $$("#filters button");
filterBtns.forEach((btn) => btn.addEventListener("click", () => {
  const f = btn.dataset.f;
  filterBtns.forEach((b) => b.classList.toggle("on", b === btn));
  $$("#mini-grid .mini").forEach((card) => card.classList.toggle("hide", f !== "all" && !card.dataset.cat.split(" ").includes(f)));
}));

/* ---------- Journey: the line fills as you scroll through the timeline ---------- */
const timeline = $("#timeline");
if (timeline) {
  let queued = false;
  const fill = () => {
    queued = false;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    timeline.style.setProperty("--fill", p.toFixed(3));
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(fill); } }, { passive: true });
  requestAnimationFrame(fill);
}

/* ---------- Contact: copy email ---------- */
const copyBtn = $("#copy-email");
copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyBtn.classList.add("copied");
    $("#copy-tag").textContent = "Copied ✓";
    setTimeout(() => { copyBtn.classList.remove("copied"); $("#copy-tag").textContent = "Copy"; }, 2200);
  } catch {
    location.href = `mailto:${copyBtn.dataset.email}`;
  }
});

/* ---------- Scroll reveals ---------- */
const revealObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("on");
  revealObserver.unobserve(e.target);
}), { threshold: 0.12 });
$$("[data-r]").forEach((el) => revealObserver.observe(el));

/* ---------- Project card videos: load lazily, play only while on screen ---------- */
const playIfAllowed = (v) => { const p = v.play(); if (p) p.catch(() => {}); };
const cardObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  const v = e.target;
  if (!e.isIntersecting) { v.pause(); return; }
  if (!v.src) v.src = v.dataset.src;
  playIfAllowed(v);
}), { threshold: 0.25 });
$$(".pvid video").forEach((v) => cardObserver.observe(v));
// Poster images load only when a card gets near the screen, not all at once on page load.
const posterObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.poster = e.target.dataset.poster;
  posterObserver.unobserve(e.target);
}), { rootMargin: "600px" });
$$("video[data-poster]").forEach((v) => posterObserver.observe(v));

/* ---------- Skills film: each scene plays forward/backward with the scrollbar ---------- */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a)); // progress of p within the [a, b] slice of a scene
const typeTo = (el, k) => { const t = el.dataset.text; el.textContent = t.slice(0, Math.round(t.length * k)); };
const lerp = (a, b, k) => a + (b - a) * k;

const scenes = {
  call(el, p) {
    typeTo(el.querySelector(".typed"), seg(p, 0.08, 0.5));
    const s = seg(p, 0.52, 0.75);
    el.style.setProperty("--s", s);
    el.querySelectorAll(".scores em").forEach((em) => { em.textContent = Math.round(em.dataset.to * s) + "%"; });
    el.style.setProperty("--r", seg(p, 0.8, 0.9));
  },
  email(el, p) {
    el.style.setProperty("--m", seg(p, 0, 0.15));
    typeTo(el.querySelector(".typed"), seg(p, 0.2, 0.8));
    el.style.setProperty("--r", seg(p, 0.85, 0.95));
  },
  ml(el, p) {
    const lines = el.querySelectorAll(".ln"), shown = Math.ceil(seg(p, 0, 0.45) * lines.length);
    lines.forEach((ln, i) => ln.classList.toggle("on", i < shown));
    const k = seg(p, 0.3, 0.95);
    el.style.setProperty("--l", 1 - k);
    el.querySelectorAll(".metrics b").forEach((b) => {
      const v = lerp(+b.dataset.from, +b.dataset.to, k);
      b.textContent = "pct" in b.dataset ? Math.round(v) + "%" : v.toFixed(3);
    });
  },
  web(el, p) {
    const blocks = el.querySelectorAll(".b"), shown = seg(p, 0, 0.7) * blocks.length;
    blocks.forEach((b, i) => b.classList.toggle("on", i < shown));
    el.querySelector(".site").classList.toggle("styled", p > 0.8);
  },
  lang(el, p) {
    const i = Math.min(3, Math.floor(seg(p, 0, 0.98) * 4));
    el.querySelectorAll(".words span, .lang-list span").forEach((s) => s.classList.toggle("on", [...s.parentNode.children].indexOf(s) === i));
  },
};

const sceneEls = $$(".scene");
let filmQueued = false;
function playFilm() {
  filmQueued = false;
  // Read every position first, then write: mixing the two forces the browser to re-lay-out the page each time.
  const navH = nav.offsetHeight, pinH = innerHeight - navH;
  const visible = sceneEls.map((el) => [el, el.getBoundingClientRect()]).filter(([, r]) => r.bottom >= 0 && r.top <= innerHeight);
  for (const [el, r] of visible) {
    const p = clamp01((navH - r.top) / (r.height - pinH));
    el.style.setProperty("--p", p);
    scenes[el.dataset.scene](el, p);
  }
}
addEventListener("scroll", () => { if (!filmQueued) { filmQueued = true; requestAnimationFrame(playFilm); } }, { passive: true });
addEventListener("resize", playFilm);
requestAnimationFrame(playFilm);

/* ---------- Hero: AI receptionist feed — each call types out, then gets its outcome ---------- */
const CALLS = [
  { who: "Priya Shah", said: "Hi, could I book a viewing for the Fenton Road house on Saturday?", tag: "✓ Viewing booked · Sat 11:00", kind: "ok" },
  { who: "Tom Reed", said: "Could someone call me back about my valuation? I'm free after five.", tag: "↪ Callback scheduled · 17:30", kind: "info" },
  { who: "Unknown number", said: "Congratulations, you've won a free holiday — press 1 to claim!", tag: "⛔ Spam blocked", kind: "bad" },
  { who: "Marsh & Co", said: "We'd like a meeting with the principal about the Grays portfolio.", tag: "✓ Meeting booked · Thu 10:00", kind: "ok" },
  { who: "Sarah Thompson", said: "Is the flat on Station Road still available to rent?", tag: "✉ Details sent by email", kind: "info" },
];
const callsEl = $("#calls"), handled = $("#handled");
let heroOn = true, callIndex = 0;
new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe($(".hero"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const whenVisible = async () => { while (!heroOn || document.hidden) await wait(400); };

(async function runFeed() {
  // Start after the page has loaded, so the typing doesn't compete with the first paint.
  if (document.readyState !== "complete") await new Promise((r) => addEventListener("load", r, { once: true }));
  await wait(1200); // after the first paint has settled
  for (;;) {
    await whenVisible();
    const c = CALLS[callIndex++ % CALLS.length];
    const li = document.createElement("li");
    li.innerHTML = `<div class="who"><b></b><span>just now</span></div><p class="said"></p><span class="tag ${c.kind}"></span>`;
    li.querySelector("b").textContent = c.who;
    li.querySelector(".tag").textContent = c.tag;
    callsEl.prepend(li);
    callsEl.querySelectorAll("li .who span").forEach((s, i) => { if (i) s.textContent = i * 2 + " min ago"; });
    while (callsEl.children.length > 4) callsEl.lastElementChild.remove();
    const said = li.querySelector(".said");
    for (let i = 1; i <= c.said.length; i++) { said.textContent = c.said.slice(0, i); await wait(28); }
    await wait(450);
    li.querySelector(".tag").classList.add("on");
    handled.textContent = +handled.textContent + 1;
    await wait(2200);
  }
})();
