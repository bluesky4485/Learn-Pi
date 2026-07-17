# Lesson image tutorials

Put screenshots and diagrams for each lesson under this folder. The site resolves paths relative to `project-intro/` (site root on GitHub Pages).

## Layout

```
assets/lessons/
  s01/
    01-loop-overview.png   # or .svg / .webp
    02-messages.png
  s02/
    01-four-tools.png
  …
```

Conventions:

- Folder name = lesson id (`s01` … `s15`)
- File prefix = zero-padded step order (`01-`, `02-`, …)
- Prefer **WebP** or **PNG** for screenshots; **SVG** for diagrams
- Max width ~1600px; keep file size small (Pages serves static files only)
- Always provide meaningful `alt` text in the lesson `figures` entry

## Wire into a lesson (`app.js`)

```js
{
  id: "s03",
  // …
  figures: [
    {
      src: "assets/lessons/s03/01-install.png",
      alt: "Terminal after npm install -g @earendil-works/pi-coding-agent",
      caption: "安装成功后，全局应能运行 pi --version",
      step: 1, // optional; shows “步骤 1”
    },
    {
      src: "assets/lessons/s03/02-login.png",
      alt: "Pi /login OAuth flow",
      caption: "交互模式中执行 /login 完成认证",
      step: 2,
    },
  ],
}
```

Figures render **after the Mermaid diagram and before the lesson HTML body**, as a “图片教程” block with lightbox on click.

You can also embed HTML figures inside `html` if you need mid-article placement:

```html
<figure class="tutorial-figure" data-lightbox>
  <img src="assets/lessons/s03/01-install.png" alt="…" loading="lazy" decoding="async" width="1200" height="675" />
  <figcaption>步骤说明</figcaption>
</figure>
```

## Checklist before commit

- [ ] Image loads with a relative path from `index.html`
- [ ] `alt` describes the UI state, not “screenshot”
- [ ] No secrets, tokens, or personal paths in captures
- [ ] Dark/light readability (or provide both if critical)
