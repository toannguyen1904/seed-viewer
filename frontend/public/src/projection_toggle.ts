import { g } from './globals.ts';

const PERSP_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <path d="M4 18 L8 6 L16 6 L20 18 Z"/>
  <line x1="5" y1="14" x2="19" y2="14"/>
  <line x1="6" y1="10" x2="18" y2="10"/>
  <line x1="10" y1="6" x2="8" y2="18"/>
  <line x1="14" y1="6" x2="16" y2="18"/>
</svg>`;

const ORTHO_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <rect x="4" y="4" width="16" height="16"/>
  <line x1="4" y1="9.33" x2="20" y2="9.33"/>
  <line x1="4" y1="14.66" x2="20" y2="14.66"/>
  <line x1="9.33" y1="4" x2="9.33" y2="20"/>
  <line x1="14.66" y1="4" x2="14.66" y2="20"/>
</svg>`;

let btnEl: HTMLElement;
let iconEl: HTMLElement;

export function initProjectionToggle() {
    const container = document.getElementById('projection-toggle')!;

    btnEl = document.createElement('div');
    btnEl.id = 'proj-toggle-btn';
    btnEl.title = 'Toggle Perspective / Orthographic projection';
    btnEl.style.cssText = `
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--theme-btn-bg);
        border: 1px solid var(--theme-btn-border);
        border-radius: 8px;
        color: var(--theme-text-muted);
        transition: background 0.15s, color 0.15s;
    `;

    iconEl = document.createElement('div');
    iconEl.style.cssText = `
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    btnEl.appendChild(iconEl);

    btnEl.addEventListener('mouseenter', () => {
        btnEl.style.background = 'var(--theme-accent-hover)';
        btnEl.style.color = 'var(--theme-text-primary)';
    });
    btnEl.addEventListener('mouseleave', () => {
        btnEl.style.background = 'var(--theme-btn-bg)';
        btnEl.style.color = 'var(--theme-text-muted)';
    });

    btnEl.addEventListener('click', () => {
        if (!g.CAMCON || !g.CAMCON.switchProjection) return;
        g.CAMCON.switchProjection();
        updateLabel();
    });

    container.appendChild(btnEl);
    updateLabel();
}

function updateLabel() {
    if (!iconEl || !g.CAMCON) return;
    const isPerspective = g.CAMCON.camera.isPerspectiveCamera;
    iconEl.innerHTML = isPerspective ? PERSP_SVG : ORTHO_SVG;
}
