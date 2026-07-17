# Learn Pi Upgrade Report

## Completed

- [x] P0: Replaced JavaScript-button navigation with real anchors and authoritative `hashchange` routing.
- [x] P0: Added destination focus management and reduced-motion-aware scrolling.
- [x] P0: Made tutorial image lightboxes operable with Enter/Space, focus containment, Escape, and focus return.
- [x] P0: Added system/light/dark theme preferences, system change tracking, improved contrast, complete control relationships, and accessible palette focus state.
- [x] P1: Upgraded the palette with executable commands and full lesson-body search.
- [x] P1: Added stable heading permalinks and a responsive page outline.
- [x] P1: Confirmed all tutorial image dimensions and wired self-hosted fonts and Mermaid.
- [x] P2: Added tabular numerals, balanced/pretty wrapping, safe-area padding, overscroll containment, tap behavior, print mode, `translate=no`, and a keyboard shortcut dialog.
- [x] Documentation: Reworked README structure and usage/verification instructions.

## Verification

- `fnm exec --using=24.16.0 -- node --check app.js` — passed.
- Static feature assertions — 7/7 passed.
- Local HTTP smoke service — five key resources returned 200 with non-empty bodies.
- Browser automation — not used, as requested.

## HTTP Smoke Results

| Resource | Status | Bytes |
|---|---:|---:|
| `/` | 200 | 19,304 |
| `/app.js` | 200 | 79,562 |
| `/styles.css` | 200 | 39,904 |
| `/assets/vendor/mermaid.min.js` | 200 | 3,565,102 |
| `/assets/fonts/inter-latin-400-normal.woff2` | 200 | 23,664 |
