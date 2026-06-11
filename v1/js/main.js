/* ════════════════════════════════════════════
   KAWLYA — interactions
   Lenis smooth scroll · GSAP ScrollTrigger · Three.js voice orb
   ════════════════════════════════════════════ */
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─────────────────────────────────
   1 · SMOOTH SCROLL (Lenis + GSAP ticker)
───────────────────────────────── */
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
window.lenis = lenis; // handy for debugging + programmatic scrolls
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// anchor links scroll through Lenis so easing stays consistent
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(id, { offset: -70 });
    }
  });
});

/* ─────────────────────────────────
   2 · THREE.JS VOICE ORB
   A sphere of points displaced by simplex noise whose amplitude
   follows a speech-like envelope — the orb "talks".
───────────────────────────────── */
const orbCanvas = document.getElementById("orb");
let orb = null;

function initOrb() {
  if (prefersReduced) return;
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas: orbCanvas, alpha: true, antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 3.1;

    const isMobile = window.innerWidth < 900;
    const COUNT = isMobile ? 3200 : 6500;

    // fibonacci sphere = perfectly even particle distribution
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      positions[i * 3] = Math.cos(t) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(t) * r;
      seeds[i] = Math.fround(Math.sin(i * 127.1) * 43758.5453 % 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.12 },
        /* gl_PointSize is in device px — scale by DPR so particles look the same on retina */
        uSize: { value: (isMobile ? 7 : 9) * Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uAmp;
        uniform float uSize;
        attribute float aSeed;
        varying float vGlow;

        // ── simplex noise (Ashima / IQ) ──
        vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
        vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v){
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 1.0/7.0;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          float n = snoise(position * 1.9 + uTime * 0.28);
          float displaced = 1.0 + n * uAmp;
          vec3 p = position * displaced;
          vGlow = smoothstep(0.0, 0.45, abs(n)) * smoothstep(0.05, 0.5, uAmp);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * (1.0 + vGlow * 0.9 + aSeed * 0.4) * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vGlow;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float soft = smoothstep(0.5, 0.05, d);
          vec3 cream = vec3(0.937, 0.902, 0.831);
          vec3 lime  = vec3(0.831, 0.980, 0.322);
          vec3 col = mix(cream, lime, vGlow);
          gl_FragColor = vec4(col, soft * (0.35 + vGlow * 0.65));
        }
      `,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // speech envelope: amplitude wanders toward random targets,
    // like syllables and pauses in a sentence
    let amp = 0.12, ampTarget = 0.25, nextChange = 0;
    const mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function resize() {
      const w = orbCanvas.clientWidth, h = orbCanvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 })
      .observe(orbCanvas);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      if (t > nextChange) {
        ampTarget = 0.06 + Math.random() * 0.42;       // next "syllable" strength
        nextChange = t + 0.25 + Math.random() * 0.9;   // ...and its duration
      }
      amp += (ampTarget - amp) * 0.055;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uAmp.value = amp;
      points.rotation.y = t * 0.07 + mouse.x * 0.18;
      points.rotation.x = Math.sin(t * 0.05) * 0.12 + mouse.y * 0.12;
      renderer.render(scene, camera);
    });
    orb = { renderer };
  } catch (err) {
    console.warn("Orb disabled (WebGL unavailable):", err);
    orbCanvas.style.display = "none";
  }
}
initOrb();

/* ─────────────────────────────────
   3 · PRELOADER → HERO INTRO
───────────────────────────────── */
const preloader = document.getElementById("preloader");
const counter = document.getElementById("preloaderCount");

const heroIntro = gsap.timeline({ paused: true });
heroIntro
  .to(".hero__title .line__in", {
    yPercent: 0, duration: 1.1, stagger: 0.12, ease: "power4.out",
    startAt: { yPercent: 110 },
  })
  .to("[data-hero-fade]", { opacity: 1, duration: 0.9, stagger: 0.08, ease: "power2.out" }, "-=0.6");

gsap.set(".hero__title .line__in", { yPercent: 110 });

if (prefersReduced) {
  preloader.remove();
  gsap.set(".hero__title .line__in", { yPercent: 0 });
  gsap.set("[data-hero-fade]", { opacity: 1 });
} else {
  const load = gsap.timeline();
  const count = { v: 0 };
  load
    .from(".preloader__mark .k-mark", { yPercent: 110, duration: 0.9, ease: "power3.out" })
    .to(count, {
      v: 100, duration: 1.1, ease: "power2.inOut",
      onUpdate: () => (counter.textContent = String(Math.round(count.v)).padStart(2, "0")),
    }, 0)
    .to(".preloader__mark", { scale: 0.92, opacity: 0, duration: 0.45, ease: "power2.in" }, ">-0.1")
    .to(preloader, {
      yPercent: -100, duration: 0.8, ease: "power4.inOut",
      onComplete: () => { preloader.remove(); },
    })
    .add(() => heroIntro.play(), "-=0.45");
}

/* ─────────────────────────────────
   4 · NAV + MOBILE MENU
───────────────────────────────── */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");

lenis.on("scroll", ({ scroll }) => {
  nav.classList.toggle("is-scrolled", scroll > 40);
});

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

/* ─────────────────────────────────
   5 · SCROLL REVEALS
───────────────────────────────── */
document.querySelectorAll("[data-reveal]").forEach((el) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 88%" },
  });
});

// footer giant wordmark parallax
gsap.from(".footer__word", {
  yPercent: 45, ease: "none",
  scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: 1 },
});

/* ─────────────────────────────────
   6 · MARQUEE (infinite, seamless)
───────────────────────────────── */
const track = document.getElementById("marqueeTrack");
const group = track.querySelector(".marquee__group");
for (let i = 0; i < 3; i++) track.appendChild(group.cloneNode(true));
gsap.to(track, { xPercent: -25, duration: 22, ease: "none", repeat: -1 });

/* ─────────────────────────────────
   7 · LIVE CALL DEMO (looping conversation)
───────────────────────────────── */
const bubbles = gsap.utils.toArray("#demoChat .bubble");
const speakerLabel = document.getElementById("demoSpeaker");
const timerEl = document.getElementById("demoTimer");
const eqBars = gsap.utils.toArray("#demoEq i");

const speakers = ["Caller is speaking…", "Kawlya is speaking…", "Caller is speaking…", "Kawlya is speaking…", "Call wrapped up ✓"];

const demoTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.2 });
bubbles.forEach((b, i) => {
  demoTl
    .add(() => (speakerLabel.textContent = speakers[i]), i * 1.9)
    .to(b, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, i * 1.9);
});
demoTl.add(() => {}, "+=1");
demoTl.eventCallback("onRepeat", () => gsap.set(bubbles, { opacity: 0, y: 14 }));

// equalizer bars dance while the demo plays
const eqTick = setInterval(() => {
  if (demoTl.paused()) return;
  eqBars.forEach((bar) => (bar.style.height = 15 + Math.random() * 85 + "%"));
}, 130);

// call timer
let demoSeconds = 0;
setInterval(() => {
  if (demoTl.paused()) return;
  demoSeconds = (demoSeconds + 1) % 3600;
  const m = String(Math.floor(demoSeconds / 60)).padStart(2, "0");
  const s = String(demoSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}, 1000);

ScrollTrigger.create({
  trigger: "#demo",
  start: "top 70%",
  onEnter: () => demoTl.play(),
  onLeave: () => demoTl.pause(),
  onEnterBack: () => demoTl.play(),
  onLeaveBack: () => demoTl.pause(),
});

/* ─────────────────────────────────
   8 · INDUSTRIES — pinned horizontal scroll on desktop,
       native swipe on mobile (CSS handles ≤640px)
───────────────────────────────── */
const mm = gsap.matchMedia();
mm.add("(min-width: 641px)", () => {
  const viewport = document.getElementById("indViewport");
  const indTrack = document.getElementById("indTrack");
  // clamp at 0: on ultra-wide screens every card already fits, nothing to scrub
  const getDistance = () => Math.max(0, indTrack.scrollWidth - viewport.clientWidth);
  const tween = gsap.to(indTrack, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: "#industries",
      start: "top top",
      end: () => "+=" + getDistance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  return () => tween.scrollTrigger?.kill();
});

/* ─────────────────────────────────
   9 · STAT COUNTERS
───────────────────────────────── */
gsap.utils.toArray(".count").forEach((el) => {
  const target = +el.dataset.count;
  gsap.fromTo(el, { textContent: 0 }, {
    textContent: target,
    duration: 1.6, ease: "power2.out",
    snap: { textContent: 1 },
    scrollTrigger: { trigger: el, start: "top 85%" },
  });
});

/* ─────────────────────────────────
   10 · TESTIMONIALS (auto-rotate + dots)
───────────────────────────────── */
const quotes = gsap.utils.toArray(".quote");
const dots = gsap.utils.toArray(".quotes__dot");
let qIndex = 0, qTimer;

function showQuote(i) {
  qIndex = i;
  quotes.forEach((q, n) => q.classList.toggle("is-active", n === i));
  dots.forEach((d, n) => d.classList.toggle("is-active", n === i));
}
function autoRotate() {
  qTimer = setInterval(() => showQuote((qIndex + 1) % quotes.length), 5200);
}
dots.forEach((d, i) => d.addEventListener("click", () => {
  clearInterval(qTimer); showQuote(i); autoRotate();
}));
autoRotate();

/* ─────────────────────────────────
   11 · BENTO HOVER GLOW + CURSOR
───────────────────────────────── */
document.querySelectorAll(".bento__card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

const cursor = document.getElementById("cursor");
if (window.matchMedia("(hover: hover)").matches && !prefersReduced) {
  const pos = { x: -100, y: -100 }, target = { x: -100, y: -100 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX; target.y = e.clientY;
    cursor.classList.add("is-on");
  });
  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.18;
    pos.y += (target.y - pos.y) * 0.18;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
  });
  document.querySelectorAll("[data-cursor], a, button, summary").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
  });
}

/* ─────────────────────────────────
   12 · ICONS
───────────────────────────────── */
lucide.createIcons();
