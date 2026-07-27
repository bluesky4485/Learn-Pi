# Learn Pi — sitio de tutoriales estáticos

Tutorial progresivo para el agente de codificación Pi. El sitio es HTML, CSS y JavaScript puro: sin pasos de compilación y sin dependencias de CDN en tiempo de ejecución.

## Características

- 15 lecciones progresivas con estado de completado almacenado localmente
- Navegación nativa por anclas con enrutamiento `hashchange`
- Permalinks estables en encabezados y un esquema contextual de "En esta página"
- Paleta de comandos con comandos ejecutables y búsqueda de texto completo en lecciones
- Lightboxes para imágenes y Mermaid accesibles mediante teclado
- Zoom de Mermaid del 10% al 150% en incrementos del 10%
- Barra lateral de lecciones redimensionable/colapsable
- Modos de tema: sistema, claro y oscuro
- Soporte de accesibilidad para movimiento reducido, área segura, impresión y alto contraste
- Recursos de Inter, JetBrains Mono y Mermaid alojados localmente

## Vista previa local

Desde este directorio:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Abre `http://127.0.0.1:5173/`.

No se requiere compilación. Después de realizar cambios en JavaScript, ejecuta:

```powershell
node --check app.js
```

Para una comprobación rápida de HTTP sin automatización de navegador:

```powershell
curl.exe -I http://127.0.0.1:5173/
curl.exe -I http://127.0.0.1:5173/assets/vendor/mermaid.min.js
curl.exe -I http://127.0.0.1:5173/assets/fonts/inter-latin-400-normal.woff2
```

## Navegación y URLs

Los enlaces a las lecciones son anclas reales. JavaScript escucha el evento `hashchange` y muestra la lección correspondiente:

- `#home` — página de inicio
- `#s08` — lección s08
- `#s08/能做什么` — un encabezado dentro de la lección s08

Por lo tanto, la navegación hacia atrás/adelante funciona a través del historial normal del navegador. Cuando la navegación cambia la lección o el encabezado visible, el foco se desplaza a ese destino; el desplazamiento es instantáneo cuando el sistema operativo solicita movimiento reducido.

## Comandos, búsqueda y atajos

Presiona `Ctrl+K` (`⌘K` en macOS) para abrir la paleta de comandos.

- Escribe texto normal para buscar títulos de lecciones, conceptos, lemas y contenido del cuerpo.
- Escribe `>` para mostrar solo los comandos ejecutables.
- Usa `↑` / `↓` y `Enter` para seleccionar y ejecutar.

Presiona `?` fuera de un campo de texto para abrir la referencia completa de atajos. Los atajos principales incluyen:

| Atajo | Acción |
|---|---|
| `Ctrl/⌘ + K` | Comandos y búsqueda de texto completo |
| `←` / `→` | Lección anterior / siguiente |
| `M` | Alternar completado de la lección actual |
| `?` | Referencia de atajos |
| `Esc` | Cerrar la superposición activa |
| `+` / `−` / `0` | Zoom de Mermaid acercar / alejar / restablecer |

## Agregar tutoriales de imágenes

Consulta [`assets/lessons/README.md`](./assets/lessons/README.md).

1. Agrega la imagen en `assets/lessons/sXX/` o `images/`.
2. Agrega una entrada de `figures` a la lección en `app.js`.
3. Incluye el `width` (ancho) y `height` (alto) intrínsecos para evitar el salto de diseño (layout shift).
4. Previsualiza a través de un servidor HTTP local; los marcos de imagen se abren con clic, `Enter` o `Espacio`.

Ejemplo:

```js
figures: [
  {
    src: "images/s01-agent-loop.png",
    alt: "Descripción de la imagen",
    caption: "Leyenda visible del tutorial.",
    width: 1168,
    height: 784,
  },
]
```

## Recursos alojados localmente

La página no depende de Google Fonts ni de un CDN de Mermaid:

| Ruta | Contenido |
|---|---|
| `assets/fonts/` | Archivos WOFF2 de Inter y JetBrains Mono |
| `assets/vendor/mermaid.min.js` | Paquete de Mermaid para el navegador |
| `images/` | PNGs de los tutoriales de las lecciones |
| `assets/lessons/` | Figuras suplementarias opcionales por lección |

Al actualizar un recurso externo, mantén el nombre del archivo estable o actualiza las referencias tanto en `index.html` como en `styles.css`.

## Estructura

| Ruta | Rol |
|---|---|
| `index.html` | Shell de la app, contenido de Inicio, diálogos, esquema |
| `app.js` | Datos de lecciones, enrutador de hash, búsqueda/comandos, progreso, Mermaid, diálogos |
| `styles.css` | Temas, diseño responsivo, accesibilidad, estilos de impresión |
| `assets/fonts/` | Archivos de fuentes alojados localmente |
| `assets/vendor/` | Recursos de terceros para navegador alojados localmente |
| `assets/lessons/` | Imágenes suplementarias por lección |
| `images/` | Imágenes principales de los tutoriales de lecciones |
| `favicon.svg` | Icono del sitio |
| `404.html` | Alternativa de GitHub Pages que preserva los hashes de las lecciones |
| `.nojekyll` | Desactiva el procesamiento de Jekyll en GitHub Pages |

## Almacenamiento local

| Clave | Propósito |
|---|---|
| `learn-pi-progress` | IDs de lecciones completadas |
| `learn-pi-theme` | `system`, `light`, o `dark` |
| `learn-pi-sidebar-width` | Ancho de la barra lateral en escritorio |
| `learn-pi-sidebar-collapsed` | Visibilidad de la barra lateral en escritorio |

## Desplegar en GitHub Pages

El repositorio incluye `.github/workflows/deploy-pages.yml`. Cada push a `main` despliega el sitio estático automáticamente con GitHub Actions.

- Repositorio: `https://github.com/1parado/Learn-Pi`
- Sitio: `https://1parado.github.io/Learn-Pi/`
- Redespliegue manual: **Actions → Deploy GitHub Pages → Run workflow**

El flujo de trabajo habilita Pages, sube el repositorio como un artefacto estático y lo despliega en el entorno `github-pages`. Se incluye `.nojekyll`.

Para un fork o un repositorio renombrado alojado bajo la ruta de otro proyecto, puedes establecer la base explícitamente en `index.html`:

```html
<meta name="site-base" content="/repo-name/" />
```

El valor vacío actual es intencional: la aplicación detecta la ruta del proyecto de GitHub Pages en tiempo de ejecución y sigue funcionando durante la vista previa local.


### 友链
学AI，上[L站](https://linux.do/)
