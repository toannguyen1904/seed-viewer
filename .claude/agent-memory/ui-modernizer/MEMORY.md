# UI Modernizer Agent Memory

## Project Layout
- Two HTML entry points: `index.html` (main viewer), `refcams.html` (reference cameras)
- Single CSS file: `frontend/public/index.css` (Tailwind directives + custom component classes + raw CSS)
- Tailwind config: `frontend/tailwind.config.js` — custom color `bones.900: #eafd4b`
- All UI-creating TS files: `frontend/public/src/` and `frontend/public/src/browser/`
- JS files (not yet migrated to TS): `timeline.js`, `threejs_builtin.js`, `customSkeletonHelper.js`, `debug.js`

## Styling Approach Audit (as of 2026-02-08)
**Three distinct styling methods coexist, creating inconsistency:**
1. **Tailwind utility classes** — used in `index.html`, `index.css` component layer, browser, timeline, spinner, metadata, divider
2. **Inline `style.cssText` strings** — heavily used in `model_selector.ts`, `projection_toggle.ts`, `settings_panel.ts`, `view_cube.ts`
3. **Raw CSS in `index.css`** — slider thumb styling, global font override, `.teko-wojtek` class

## Component Styling Patterns
- `.mybutton` = teal-500 bg, white text, hover teal-400 (Tailwind @apply in index.css)
- `.myinput` = bordered input with gray-400 border, white bg
- `.myselect` = bordered select
- `.myicon` = gray-400 text, hover teal-400 (used for timeline icon buttons)
- `.mycheckbox` = hover teal-400, accent-white
- Labeller thumb classes exist but seem unused (legacy)

## Color Palette Issues
- Primary accent: teal-500/teal-400 (used in buttons, dividers, active toggle states, slider thumbs)
- `bones: #eafd4b` defined in Tailwind config but NEVER used in any UI component (only in settings panel badge `background: #eafd4b` as inline style)
- Light theme: white/gray-100/gray-200 backgrounds (browser, metadata table)
- No dark mode at all despite this being a 3D viewer app
- View cube / model selector / projection toggle / settings use `rgba(240,240,240,0.92)` bg, `#888` text, hover `rgba(100,200,220,0.9)`

## Layout Structure
- Two-column layout: left pane (browser + metadata) | right pane (3D viewport + timeline)
- Resizable dividers (h and v) using teal-500 bars
- Viewport overlay: upperbar (top-right, flex-col) contains model-selector, projection-toggle, settings-toggle, view-cube, show-refcam, download-anim
- Timeline: absolute bottom of viewport

## Key Issues Identified
1. Massive inline CSS in newer components (model_selector, settings_panel, view_cube, projection_toggle) — bypasses Tailwind entirely
2. Loading screen uses `bg-white/70` (light) which clashes with 3D viewer use case
3. Browser/metadata tables use light bg (white, gray-100, gray-200) — not dark-mode friendly
4. Global font override `*{font-family: 'Gill Sans'...}` fights Tailwind's font utilities
5. Tailwind `bones` color is misconfigured (only `bones.900` exists, should have full scale or just be `bones`)
6. Settings panel is the most complex UI — entirely inline CSS, no Tailwind
7. No focus states on most interactive elements (global `*:focus { outline: none }` removes all focus indicators)
8. No transitions on table rows, inputs, etc.
9. `PERPAGE: 1000` — no visible pagination controls (prev/next buttons), just a page number input
10. refcams.html uses minimal styling, no dark mode

## File Cross-Reference for UI Changes
- `index.html` — main layout structure, loading screen
- `index.css` — Tailwind directives, component classes, global overrides
- `tailwind.config.js` — theme config
- `timeline.js` — timeline bar, playback controls, slider (JS not TS)
- `divider.ts` — resizable pane dividers
- `spinner.ts` — loading spinner overlay
- `browser/__createLocalFilesBrowser.ts` — search bar, pagination, browser container
- `browser/__refreshBrowserTable.ts` — table rows, headers
- `metadata_viewer.ts` — metadata key-value table
- `model_selector.ts` — model dropdown (inline CSS)
- `projection_toggle.ts` — ortho/persp button (inline CSS)
- `settings_panel.ts` — lighting settings panel (inline CSS)
- `view_cube.ts` — 3D navigation cube (inline CSS)
- `download_anim.ts` — download button
- `show_refcam.ts` — refcam button
