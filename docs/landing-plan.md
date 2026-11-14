# Landing page plan (Venoxa AI)

Adds a public landing page for logged-out visitors at `/` and `/welcome`.
No other screen is touched.

## Verified facts this plan relies on

- App is tab-state driven (`activeTab` in `App.jsx`); `src/router.jsx` maps URL ↔ tab.
  `pathToState('/')` returns `null` → legacy root falls through to the dashboard.
- Auth modal state: `isAuthModalOpen` / `setIsAuthModalOpen`, `authModalMode` /
  `setAuthModalMode` (`'login' | 'register'`); `AuthModal` self-closes on success
  (`onClose()`), and `login()`/`register()` set `token`/`user` **without navigating** —
  so the landing must navigate to the dashboard when `user` arrives after mount.
- Theme: `venoxa_theme` + `dark` class on `<html>` (App.jsx effect). Language:
  `venoxa_lang` (default `ar`) + `document.documentElement.dir` (App.jsx effect).
  Both persist via the existing setters — the landing only calls `setTheme`/`setLang`.
- Design tokens `--vxp-*` (index.css ~line 1863) already match the requested palette
  (primary `#0e4aa4`, mint `#c8efe8`, amber `#ffecd6`, success `#1f9d74`, navy darks).
  Tailwind 4 `dark:` variant is class-based (`@custom-variant`).
- No App Store / Google Play links exist anywhere in `src/` → the "learn anywhere"
  band stays text-only.
- `PathMap.jsx` is a data-driven page component (fetches `/api/path/map`) — it cannot
  be dropped into a hero as-is. Its *node visual language* (56/68px circles, green
  check / blue play / grey lock, black "تابع" pill with arrow, dotted connectors,
  zig-zag offsets `[0, 32, 44, 24]`) is reproduced as small static illustrations
  instead. Assumption logged in the report.
- Footer (`src/Footer.jsx`) is reused as-is (props: `lang, setLang, setTab, user,
  onOpenRegister`); it already contains an EN/العربية switch for mobile.

## Components

```
src/landing/
  Landing.jsx          page shell: skip link, top bar, <main> with all sections, Footer
  LandingTopBar.jsx    minimal sticky bar (logo, lang EN/عربي, theme, Log in, Get started)
  strings.js           ALL landing copy, both languages (landingCopy(lang) helper)
  reveal.js            IntersectionObserver fade/rise wrapper (no library, reduced-motion safe)
  landing.css          only what Tailwind can't do: reveal/float keyframes, CTA block
                       colors (--vx-cta-bg per theme), skip link, button press edge
  sections/
    Hero.jsx           H1 + sub + 2 buttons | phone mock-up with path nodes + floating chips
    LevelStrip.jsx     5 level chips (blue/mint/amber/purple/green) + caption
    Feature.jsx        alternating text/illustration section (5 instances, data-driven)
    LearnAnywhere.jsx  devices illustration band (no store badges)
    Tools.jsx          wrap of 10 tool chips (labels/icons reused from the app's nav)
    FinalCta.jsx       wavy-top blue block, white Get started, account link, Footer follows
  illustrations/
    HeroArt.jsx        phone + mini path (2 done, 1 current w/ Start tag, 1 locked) + chips
    PathZigzag.jsx     vertical zig-zag path nodes (blue theme)
    Flashcards.jsx     card stack + Again/Good/Easy (mint)
    ChatMic.jsx        chat bubbles + glowing microphone (amber/purple)
    SkillsArt.jsx      grammar card + headphones + checked answer (blue/mint)
    LevelBadgeArt.jsx  level badge + certificate card (amber)
    DevicesArt.jsx     phone + laptop outlines + floating shapes
```

Every illustration is original inline JSX/CSS (rounded rectangles, circles, chips,
lucide icons on tinted tiles), `aria-hidden`, no external assets, no new deps,
each well under 4 KB.

## Routing change (minimal)

- `router.jsx` → `pathToState`: `/welcome` → `{ tab: 'landing' }` (before the legacy
  root check). Bare root stays `null` (dashboard fallthrough for logged-in).
- `App.jsx` init: `initTabFromUrl()` result stays, except
  `/welcome` → always `landing`, and bare `/` → `landing` only when there is no
  `venoxa_token` in localStorage (logged out). Everything else untouched.
- `App.jsx` early return (before the app shell return): when `activeTab === 'landing'`
  render `<Landing/>` + the existing `<AuthModal/>` standalone (own top bar, no
  AppHeader/MobileTabBar/PremiumBackground). `tabToPath('landing')` is intentionally
  undefined, so the bridge never rewrites the URL — `/` stays `/`, `/welcome` stays
  `/welcome`. Back/forward works because `pathToState('/welcome')` maps to landing.
- Landing navigates to the dashboard when `user` appears after mount (login just
  succeeded) but never bounces a visitor who opened `/welcome` while already
  signed in.

## Strings

All copy lives in `src/landing/strings.js` (English + Arabic pairs), consumed via
one `landingCopy(lang)` helper — same pattern as `_resolveTranslation` inline usage
elsewhere. Tool chips reuse the app's own Arabic nav labels verbatim
(الترجمة الذكية، إعادة صياغة النبرة، محلّل الجمل، الأزواج الدنيا، عائلة الكلمة،
متلازمات الكلمات، أصول الكلمات، كلمة اليوم، تعبير اليوم، المؤقت).

## A11y / SEO / performance

- One `<h1>`; `header/main/section[aria-labelledby]/footer` landmarks; skip link;
  focus rings reuse `FOCUS_RING` from the UI kit; AA contrast in both themes.
- Logical properties + `dir` mirroring; letter-spacing zeroed for Arabic headlines
  (negative tracking breaks Arabic letter joining).
- `index.html`: new title, meta description, OG tags, plus a tiny pre-paint script
  that applies `venoxa_theme`/`venoxa_lang` (class `dark` + `dir`) before first paint.
- No images, no new dependencies; landing replaces the whole app shell for guests,
  so logged-out `/` renders far less JS/DOM than today. Reveal animations are
  transform/opacity only (no layout shift) and disabled under
  `prefers-reduced-motion: reduce`.

## Verification checklist

- Screenshots at 1440 / 1024 / 768 / 390 px, light+dark, EN+AR →
  `docs/landing-screenshots/`.
- Get started → register form; "I already have an account" and top-bar Log in →
  login form; logged-in `/` → dashboard (not landing); logged-in `/welcome` →
  landing with "Open the app"; theme/lang toggles work and persist; `#/verify/…`
  and site hash links unaffected; no new console errors; `vite build` passes.
