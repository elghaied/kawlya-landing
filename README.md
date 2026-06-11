# Kawlya — Landing Page (Design Reference)

Dark-editorial landing page for **Kawlya**, an AI assistant for business phone lines.
Built as a static design reference to be rebuilt in PayloadCMS.

## Run it

Any static server works:

```bash
npx http-server . -p 4173
```

## Design system

| Token | Value | Use |
|---|---|---|
| `--bg` | `#060a13` | page background (deep ink navy) |
| `--bg-2` | `#0a101c` | alternate section background |
| `--surface` | `#101828` | cards, panels |
| `--cream` | `#e9f0f9` | primary text |
| `--cream-dim` | `#8d9bb0` | secondary text |
| `--accent` | `#62d9ff` | electric cyan — CTAs, highlights, em text |
| `--accent-ink` | `#02131c` | text on cyan |
| `--line` | `rgba(233,240,249,.13)` | borders/dividers |

**Fonts (Google Fonts):**
- Display: **Fraunces** (serif, 300–600 + italics) — headlines, big numbers, footer wordmark
- Body: **Archivo** (400–600)
- Labels/UI: **IBM Plex Mono** — eyebrows, buttons, nav (uppercase, letter-spaced)

**Libraries (CDN):** GSAP 3.12 + ScrollTrigger, Lenis 1.1 (smooth scroll), Three.js 0.160 (hero particle orb), Lucide (icons). Photos from Pexels (hotlinked, free license).

## Section map (→ Payload blocks)

1. **Preloader** — K logo reveal + counter
2. **Hero** — headline, sub, CTAs, Three.js voice orb, floating call card, mini stats
3. **Logo marquee** — trusted-by strip (infinite scroll)
4. **Live call demo** (`#demo`) — looping chat transcript + equalizer + 3 selling points
5. **How it works** (`#how`) — sticky intro + 3 step cards
6. **Features bento** (`#features`) — 6 cards (2 wide, 4 small), hover glow
7. **Industries** (`#industries`) — pinned horizontal scroll (desktop) / swipe (mobile), 5 image cards
8. **Stats** — 4 animated counters
9. **Testimonials** — 3 rotating quotes with portraits
10. **Pricing** (`#pricing`) — 3 tiers, middle featured
11. **FAQ** (`#faq`) — accordion (native `<details>`)
12. **Final CTA** (`#cta`) + **Footer** — giant outlined wordmark with parallax

## Implementation notes

- `body { overflow-x: clip }` — do **not** change to `hidden`; `hidden` creates a second
  scroll container that fights Lenis (black-screen bug).
- The orb (`js/main.js` → `initOrb`) is a fibonacci-sphere of GPU points displaced by
  simplex noise; `uAmp` follows a random "speech envelope" so it pulses like a voice.
  Particle count and point size drop on mobile; it pauses off-screen and is skipped
  entirely under `prefers-reduced-motion`.
- Industries pin distance is clamped to ≥0 (ultra-wide screens fit all cards, no pin).
- All scroll-reveal elements use `[data-reveal]`; hero intro uses `[data-hero-fade]`.
- `window.lenis` is exposed for debugging/programmatic scrolls.
