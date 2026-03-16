/**
 * Centralized UI color theme using CSS custom properties.
 * Import and call initTheme() early (before any UI modules).
 * To change the look, edit the values here — everything else references these vars.
 */

const THEME = {
    // ── Page ──────────────────────────────────────────────
    '--theme-page-bg':              '#c1c2b6',        // body / loading screen (gray-100) 

    // ── Panels / cards ───────────────────────────────────
    '--theme-panel-bg':             '#ffffff',         // white cards, modal, nav-btn active
    '--theme-panel-bg-frosted':     'rgba(255, 255, 255, 0.95)',  // settings panel
    '--theme-panel-border':         '#e5e7eb',         // card / table header borders (gray-200)
    '--theme-panel-border-light':   'rgba(0, 0, 0, 0.06)',       // section dividers (light)
    '--theme-panel-border-medium':  'rgba(0, 0, 0, 0.08)',       // section dividers

    // ── Buttons / controls ───────────────────────────────
    '--theme-btn-bg':               'rgba(248, 248, 248, 0.92)', // default button bg
    '--theme-btn-bg-light':         'rgba(240, 240, 240, 0.7)',  // nav-btn bg
    '--theme-btn-border':           'rgba(190, 190, 190, 0.7)',  // button borders
    '--theme-btn-border-light':     'rgba(190, 190, 190, 0.5)',  // panel borders (lighter)

    // ── Accent (bones lime) ──────────────────────────────
    '--theme-accent':               '#eafd4b',         // brand color
    '--theme-accent-hover':         'rgba(234, 253, 75, 0.92)',  // hover bg
    '--theme-accent-hover-half':    'rgba(234, 253, 75, 0.5)',   // lighter hover (model selector)

    // ── Text ─────────────────────────────────────────────
    '--theme-text-primary':         '#333',            // headings, hover text
    '--theme-text-secondary':       '#666',            // labels, muted text
    '--theme-text-muted':           '#888',            // icons, default button text
    '--theme-text-faint':           '#999',            // close buttons, chevrons
    '--theme-text-dimmed':          '#868789',         // nav-btn default text (gray-400)

    // ── Overlay / temporal labels ────────────────────────
    '--theme-overlay-bg':           'rgba(0, 0, 0, 0.38)',       // label container bg
    '--theme-overlay-chip-bg':      'rgba(0, 0, 0, 0.22)',       // label chip bg
    '--theme-overlay-chip-text':    'rgba(255, 255, 255, 0.65)', // label chip text
    '--theme-overlay-text':         '#fff',                       // main label text
    '--theme-overlay-shadow-hard':  'rgba(0, 0, 0, 0.85)',       // text shadow (4-side)
    '--theme-overlay-shadow-soft':  'rgba(0, 0, 0, 0.55)',       // text shadow (bottom)
    '--theme-label-segment-bg':     'rgba(0, 0, 0, 0.11)', // timeline label segments

    // ── Shadows ──────────────────────────────────────────
    '--theme-shadow':               'rgba(0, 0, 0, 0.12)',       // panel box-shadow
    '--theme-shadow-light':         'rgba(0, 0, 0, 0.08)',       // nav-btn active shadow

    // ── Slider ───────────────────────────────────────────
    '--theme-slider-thumb':         '#fff',
    '--theme-slider-thumb-border':  'rgba(0, 0, 0, 0.1)',

    // ── Modal ────────────────────────────────────────────
    '--theme-modal-backdrop':       'rgba(0, 0, 0, 0.4)',

    // ── Spinner ──────────────────────────────────────────
    '--theme-spinner-bg':           'rgba(0, 0, 0, 0.2)',
    '--theme-spinner-text-bg':      'rgba(0, 0, 0, 0.4)',

    // ── Misc ─────────────────────────────────────────────
    '--theme-regen-btn-bg':         '#f5f5f5',
    '--theme-nav-btn-active-border': '#d1d5db',
} as const;

export type ThemeVars = typeof THEME;

/** Inject CSS custom properties onto :root. Call once at startup. */
export function initTheme() {
    const root = document.documentElement.style;
    for (const [prop, value] of Object.entries(THEME)) {
        root.setProperty(prop, value);
    }
}
