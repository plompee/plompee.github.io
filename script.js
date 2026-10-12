import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

window.__ready = true;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Navigation: solid bar on scroll, active section, mobile menu ---------- */
const nav = $("#nav"), menuBtn = $("#menu-btn"), links = $("#nav-links");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 10);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

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

/* ---------- Scroll reveals ---------- */
const revealObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("on");
  revealObserver.unobserve(e.target);
}), { threshold: 0.12 });
$$("[data-r]").forEach((el) => revealObserver.observe(el));

/* ---------- Project visuals: built once, animated only while on screen ---------- */
$$(".wave").forEach((w) => { for (let i = 0; i < 28; i++) w.insertAdjacentHTML("beforeend", `<i style="--d:${Math.random() * 1.1}"></i>`); });
$$(".city").forEach((c) => { for (let i = 0; i < 12; i++) c.insertAdjacentHTML("beforeend", `<i style="--h:${30 + Math.random() * 70}%;--d:${Math.random() * 3}"></i>`); });
$$(".net").forEach((svg) => {
  const pts = [3, 5, 5, 2].map((n, l) => Array.from({ length: n }, (_, i) => [30 + l * 80, 100 + (i - (n - 1) / 2) * 38]));
  let h = "";
  pts.slice(1).forEach((layer, l) => layer.forEach((b) => pts[l].forEach((a) => {
    h += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${Math.random() < 0.3 ? "hot" : ""}"/>`;
  })));
  pts.flat().forEach((p) => { h += `<circle cx="${p[0]}" cy="${p[1]}" r="8"/>`; });
  svg.innerHTML = h;
});
// The Murmuration preview is a live simulation, so its iframe only exists while the card is visible.
const visualObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  const el = e.target, src = el.dataset.preview;
  el.classList.toggle("live", e.isIntersecting);
  if (!src) return;
  if (e.isIntersecting && !el.firstChild) el.innerHTML = `<iframe src="${src}" title="Live preview" tabindex="-1"></iframe>`;
  else if (!e.isIntersecting) el.replaceChildren();
}), { rootMargin: "100px" });
$$(".pvis").forEach((el) => visualObserver.observe(el));

/* ---------- Hero: lightweight WebGL blob ---------- */
const canvas = $("#gl");
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" }); } catch { renderer = null; }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 6;
  const uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } };

  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 24), new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime; uniform vec2 uMouse;
      varying float vD; varying vec3 vN, vV;
      void main() {
        vec3 p = position * .9 + vec3(uMouse, 0.) * .6;
        float d = (sin(p.x * 2.1 + uTime * .8) * sin(p.y * 2.7 - uTime) * sin(p.z * 2.3 + uTime * .6)
                + .4 * sin(p.x * 4.3 - uTime * 1.1 + p.y * 3.1) * sin(p.z * 4.7 + uTime * .7)) * .3;
        vD = d;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position + normal * d, 1.);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vD; varying vec3 vN, vV;
      void main() {
        float f = pow(1. - max(dot(vN, vV), 0.), 2.);
        float h = clamp(vD * 1.4 + .35 + f * .6, 0., 1.);
        vec3 c = mix(vec3(.02, .04, .12), vec3(.12, .3, .85), smoothstep(0., .45, h));
        c = mix(c, vec3(.5, .78, 1.), smoothstep(.45, .85, h));
        c = mix(c, vec3(.95, .98, 1.), smoothstep(.88, 1., h));
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  scene.add(blob);

  // Static star dust: positions are uploaded once and the whole cloud just rotates.
  const pos = new Float32Array(400 * 3).map(() => (Math.random() - 0.5) * 10);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.03, color: 0x9cc4ff, transparent: true, opacity: 0.6, depthWrite: false }));
  scene.add(dust);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight, wide = w > 960;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    blob.position.set(wide ? 2.6 : 0.6, wide ? 0 : 1.2, 0);
    blob.scale.setScalar(wide ? 0.9 : 0.75);
  };
  resize();
  addEventListener("resize", resize);

  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($(".hero"));
  const clock = new THREE.Clock();
  const render = () => {
    const t = clock.getElapsedTime(), m = uniforms.uMouse.value;
    uniforms.uTime.value = t;
    m.x += (mouse.x - m.x) * 0.04; m.y += (mouse.y - m.y) * 0.04;
    blob.rotation.set(m.y * 0.5, t * 0.1 + m.x * 0.6, 0);
    dust.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  };
  render();
  renderer.setAnimationLoop(() => { if (visible) render(); });
}
