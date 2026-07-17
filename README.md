# Learn Pi — static tutorial site

Progressive harness tutorial for the Pi coding agent. The site is plain HTML, CSS, and JavaScript: no build step and no runtime CDN dependency.

## Features

- 15 progressive lessons with completion state stored locally
- Native anchor navigation with `hashchange` routing
- Stable heading permalinks and a contextual “On this page” outline
- Command palette with executable commands and full-text lesson search
- Keyboard-accessible image and Mermaid lightboxes
- Mermaid zoom from 10% to 150% in 10% increments
- Resizable/collapsible lesson sidebar
- System, light, and dark theme modes
- Reduced-motion, safe-area, print, and high-contrast accessibility support
- Self-hosted Inter, JetBrains Mono, and Mermaid assets

## Local preview

From this directory:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

No build is required. After JavaScript changes, run:

```powershell
node --check app.js
```

For a lightweight HTTP smoke check without browser automation:

```powershell
curl.exe -I http://127.0.0.1:5173/
curl.exe -I http://127.0.0.1:5173/assets/vendor/mermaid.min.js
curl.exe -I http://127.0.0.1:5173/assets/fonts/inter-latin-400-normal.woff2
```

## Navigation and URLs

Lesson links are real anchors. JavaScript listens to `hashchange` and displays the matching lesson:

- `#home` — home page
- `#s08` — lesson s08
- `#s08/能做什么` — a heading inside lesson s08

Back/forward navigation therefore works through normal browser history. When navigation changes the visible lesson or heading, focus moves to that destination; scrolling becomes instant when the operating system requests reduced motion.

## Commands, search, and shortcuts

Press `Ctrl+K` (`⌘K` on macOS) to open the command palette.

- Type ordinary text to search lesson titles, concepts, mottos, and body content.
- Type `>` to show executable commands only.
- Use `↑` / `↓` and `Enter` to select and execute.

Press `?` outside a text field to open the full shortcut reference. Core shortcuts include:

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + K` | Commands and full-text search |
| `←` / `→` | Previous / next lesson |
| `M` | Toggle current lesson completion |
| `?` | Shortcut reference |
| `Esc` | Close the active overlay |
| `+` / `−` / `0` | Mermaid zoom in / out / reset |

## Adding image tutorials

See [`assets/lessons/README.md`](./assets/lessons/README.md).

1. Add the image under `assets/lessons/sXX/` or `images/`.
2. Add a `figures` entry to the lesson in `app.js`.
3. Include the intrinsic `width` and `height` to prevent layout shift.
4. Preview through a local HTTP server; image frames open with click, `Enter`, or `Space`.

Example:

```js
figures: [
  {
    src: "images/s01-agent-loop.png",
    alt: "Description of the image",
    caption: "Visible tutorial caption.",
    width: 1168,
    height: 784,
  },
]
```

## Self-hosted assets

The page does not depend on Google Fonts or a Mermaid CDN:

| Path | Contents |
|---|---|
| `assets/fonts/` | Inter and JetBrains Mono WOFF2 files |
| `assets/vendor/mermaid.min.js` | Mermaid browser bundle |
| `images/` | Lesson tutorial PNGs |
| `assets/lessons/` | Optional per-lesson supplemental figures |

When updating a vendored asset, keep the filename stable or update both `index.html` and `styles.css` references.

## Structure

| Path | Role |
|---|---|
| `index.html` | App shell, Home content, dialogs, outline |
| `app.js` | Lesson data, hash router, search/commands, progress, Mermaid, dialogs |
| `styles.css` | Themes, responsive layout, accessibility, print styles |
| `assets/fonts/` | Self-hosted font files |
| `assets/vendor/` | Self-hosted third-party browser assets |
| `assets/lessons/` | Per-lesson supplemental images |
| `images/` | Main lesson tutorial images |
| `favicon.svg` | Site icon |
| `404.html` | GitHub Pages fallback preserving lesson hashes |
| `.nojekyll` | Disable Jekyll processing on GitHub Pages |

## Local storage

| Key | Purpose |
|---|---|
| `learn-pi-progress` | Completed lesson IDs |
| `learn-pi-theme` | `system`, `light`, or `dark` |
| `learn-pi-sidebar-width` | Desktop sidebar width |
| `learn-pi-sidebar-collapsed` | Desktop sidebar visibility |

## Deploy to GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. Every push to `main` deploys the static site automatically with GitHub Actions.

- Repository: `https://github.com/1parado/Learn-Pi`
- Site: `https://1parado.github.io/Learn-Pi/`
- Manual redeploy: **Actions → Deploy GitHub Pages → Run workflow**

The workflow enables Pages, uploads the repository as a static artifact, and deploys it to the `github-pages` environment. `.nojekyll` is included.

For a fork or renamed repository hosted below another project path, you can optionally set the base explicitly in `index.html`:

```html
<meta name="site-base" content="/repo-name/" />
```

The current empty value is intentional: the application detects the GitHub Pages project path at runtime and continues to work during local preview.
