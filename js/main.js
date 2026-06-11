/* ════════════════════════════════════════════
   KAWLYA v4 — interactions
   Lenis · GSAP reveals · égaliseurs · vague dorée
   ════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── défilement fluide ─── */
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
window.lenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(id, { offset: -80 });
    }
  });
});

/* ─── nav + menu mobile ─── */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");

lenis.on("scroll", ({ scroll }) => nav.classList.toggle("is-scrolled", scroll > 30));

function closeMenu() {
  burger.classList.remove("is-open");
  menu.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
  lenis.start();
}
burger.addEventListener("click", () => {
  const open = !menu.classList.contains("is-open");
  burger.classList.toggle("is-open", open);
  menu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-hidden", String(!open));
  open ? lenis.stop() : lenis.start();
});

/* ─── révélations au scroll ─── */
if (prefersReduced) {
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
} else {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      // nettoie les styles inline : un transform résiduel casserait les enfants
      // en position fixed, et une opacité inline écraserait les règles CSS
      onComplete() {
        el.classList.add("is-revealed");
        gsap.set(el, { clearProps: "opacity,transform" });
      },
    });
  });
}

/* ─── égaliseurs (téléphone + lecteur démo) ─── */
const phoneBars = document.querySelectorAll("#phoneEq i");
const demoBars = document.querySelectorAll("#demoEq i");
let demoPlaying = true;

function animateBars(bars, min, max) {
  bars.forEach((b, i) => {
    // enveloppe en cloche : les barres centrales sont plus hautes
    const bell = Math.sin((i / (bars.length - 1)) * Math.PI);
    b.style.height = min + Math.random() * (max - min) * (0.35 + bell * 0.65) + "%";
  });
}
if (!prefersReduced) {
  setInterval(() => animateBars(phoneBars, 12, 92), 140);
  setInterval(() => { if (demoPlaying) animateBars(demoBars, 10, 95); }, 130);
} else {
  animateBars(phoneBars, 12, 92);
  animateBars(demoBars, 10, 95);
}

/* minuteur du téléphone */
const phoneTimer = document.getElementById("phoneTimer");
let callSeconds = 8;
setInterval(() => {
  callSeconds = (callSeconds + 1) % 3600;
  const m = String(Math.floor(callSeconds / 60)).padStart(2, "0");
  const s = String(callSeconds % 60).padStart(2, "0");
  phoneTimer.textContent = `${m}:${s}`;
}, 1000);

/* bouton lecture démo : bascule lecture / pause */
const demoPlay = document.getElementById("demoPlay");
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
demoPlay.innerHTML = ICON_PAUSE;
demoPlay.addEventListener("click", () => {
  demoPlaying = !demoPlaying;
  demoPlay.innerHTML = demoPlaying ? ICON_PAUSE : ICON_PLAY;
  if (!demoPlaying) demoBars.forEach((b) => (b.style.height = "12%"));
});

/* ─── vague de particules dorées (héro) ─── */
const waveCanvas = document.getElementById("goldWave");
if (waveCanvas && !prefersReduced) {
  const ctx = waveCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio, 2);
  let w, h, dots;

  function setup() {
    w = waveCanvas.clientWidth;
    h = waveCanvas.clientHeight;
    waveCanvas.width = w * dpr;
    waveCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const COUNT = Math.floor((w * h) / 4200);
    dots = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      sp: 0.15 + Math.random() * 0.4,   // vitesse de dérive
      ph: Math.random() * Math.PI * 2,  // phase de l'ondulation
      a: 0.15 + Math.random() * 0.5,
    }));
  }
  setup();
  window.addEventListener("resize", setup);

  let waveVisible = true;
  new IntersectionObserver(([e]) => (waveVisible = e.isIntersecting)).observe(waveCanvas);

  let t = 0;
  (function draw() {
    requestAnimationFrame(draw);
    if (!waveVisible) return;
    t += 0.012;
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x -= d.sp;
      if (d.x < -4) d.x = w + 4;
      // les points ondulent le long de bandes sinusoïdales
      const yo = Math.sin(d.x * 0.012 + d.ph + t) * 26 + Math.sin(d.x * 0.004 + t * 0.6) * 40;
      // plus dense et plus lumineux vers la droite
      const fade = Math.min(1, Math.max(0, (d.x - w * 0.15) / (w * 0.6)));
      ctx.globalAlpha = d.a * fade;
      ctx.fillStyle = "#c5a368";
      ctx.beginPath();
      ctx.arc(d.x, d.y + yo, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
}

/* ─── icônes ─── */
lucide.createIcons();
