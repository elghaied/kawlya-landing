# Kawlya — Landing Page (Design Reference)

Dark-editorial landing page for **Kawlya**, an AI assistant for business phone lines.
Built as a static design reference to be rebuilt in PayloadCMS.

## Run it

Any static server works:

```bash
npx http-server . -p 4173
```

## Design system (v4 — design client)

| Token | Valeur | Usage |
|---|---|---|
| `--noir` | `#0f0e0c` | fond sombre (héro, stats, démo, footer) |
| `--creme` | `#f2efe9` | sections claires |
| `--blanc` | `#ffffff` | cartes |
| `--or` | `#c5a368` | accent or champagne (CTA, icônes, em) |
| `--or-clair` / `--or-fonce` | `#dcc394` / `#a98850` | dégradés boutons |
| `--encre` | `#191711` | texte sur clair |

**Polices (Google Fonts) :** Plus Jakarta Sans (UI/titres) · Marcellus (monogramme + wordmark KAWLYA).
**Libs (CDN) :** GSAP + ScrollTrigger, Lenis, Lucide. Pas de Three.js en v4 — vague de particules dorées en canvas 2D.

## Sections (→ blocs Payload)

1. **Héro** — H1, CTAs, coches, mockup téléphone (égaliseur animé, minuteur), 6 puces flottantes, canvas vague dorée
2. **Logos** — bande crème « Déjà adopté par… »
3. **Stats** — noir, 4 colonnes avec séparateurs (0 appel manqué, < 2 sec, + de RDV, + de temps)
4. **Fonctionnalités** — crème, 6 cartes blanches
5. **Démo** — carte noire arrondie, lecteur (play/pause + égaliseur + citation)
6. **Tarifs** — 3 cartes (Performance mise en avant, badge « Le plus choisi »)
7. **FAQ** — accordéons blancs sur 2 colonnes
8. **Footer** — noir, marque + 3 colonnes + bloc CTA téléphone

## Notes d'implémentation

- `body { overflow-x: clip }` — ne pas remplacer par `hidden` (créerait un second conteneur de scroll qui casse Lenis).
- Reveals : après l'animation GSAP, les styles inline sont nettoyés (`clearProps`) et l'état final est posé via `.is-revealed` — sinon le transform résiduel casse les enfants `position: fixed` et l'opacité inline écrase le CSS.
- `window.lenis` est exposé pour le debug.

## Versions (git)

- `master` — v1 : noir chaud + lime, orbe particules
- `v2-blue-redesign` — v2 : bleu nuit + cyan, héro plein écran + UnrealBloom
- `v3-creative-sections` — v3 : sections typographiques (type-list, rangées éditoriales)
- `v4-client-design` — v4 : design client (noir + or, FR) ← actuel
