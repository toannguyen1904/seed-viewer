import { g } from './globals.ts';

interface TemporalLabelEvent {
    start_time: number;
    end_time: number;
    description: string;
}

let labelsEnabled = false;
let labelEvents: TemporalLabelEvent[] | null = null;
let currentLabelIdx = -1;
let overlayEl: HTMLDivElement | null = null;
let textEl: HTMLDivElement | null = null;
let labelEl: HTMLDivElement | null = null;
let fetchVersion = 0;

export function initTemporalLabels() {
    // Create DOM overlay
    overlayEl = document.createElement('div');
    overlayEl.id = 'temporal-label-overlay';
    Object.assign(overlayEl.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '52px',
        textAlign: 'center',
        padding: '0 8%',
        pointerEvents: 'none',
        zIndex: '25',
        display: 'none',
    });

    // Wrapper: inline-block container holding both label and text
    const wrapperEl = document.createElement('div');
    Object.assign(wrapperEl.style, {
        display: 'inline-block',
        maxWidth: '100%',
        padding: '10px 16px',
        borderRadius: '14px',
        background: 'var(--theme-overlay-bg)',
        textAlign: 'left',
    });

    // "Temporal label" small title above the text
    labelEl = document.createElement('div');
    labelEl.id = 'temporal-label-title';
    Object.assign(labelEl.style, {
        marginBottom: '4px',
    });

    const labelSpan = document.createElement('span');
    Object.assign(labelSpan.style, {
        padding: '1px 6px',
        borderRadius: '3px',
        background: 'var(--theme-overlay-chip-bg)',
        color: 'var(--theme-overlay-chip-text)',
        fontSize: '10px',
        fontWeight: '500',
        letterSpacing: '0.3px',
    });
    labelSpan.textContent = 'Temporal label';
    labelEl.appendChild(labelSpan);

    textEl = document.createElement('div');
    textEl.className = 'temporalLabelText';
    Object.assign(textEl.style, {
        color: 'var(--theme-overlay-text)',
        fontWeight: '650',
        fontSize: 'clamp(18px, 2.2vw, 32px)',
        lineHeight: '1.15',
        textShadow: [
            '-2px -2px 0 var(--theme-overlay-shadow-hard)',
            ' 2px -2px 0 var(--theme-overlay-shadow-hard)',
            '-2px  2px 0 var(--theme-overlay-shadow-hard)',
            ' 2px  2px 0 var(--theme-overlay-shadow-hard)',
            ' 0px  4px 10px var(--theme-overlay-shadow-soft)',
        ].join(','),
    });

    wrapperEl.appendChild(labelEl);
    wrapperEl.appendChild(textEl);
    overlayEl.appendChild(wrapperEl);

    document.getElementById('right-pane-up')!.appendChild(overlayEl);

    // Register UPDATE_LOOP callback
    g.UPDATE_LOOP['temporalLabels'] = updateTemporalLabels;
}

function updateTemporalLabels() {
    if (!labelsEnabled || !labelEvents || !g.MODEL3D?.anim) {
        if (overlayEl) overlayEl.style.display = 'none';
        return;
    }

    const timeInSeconds = g.FRAME / g.MODEL3D.anim.fps;

    // Try cached index first
    if (currentLabelIdx >= 0 && currentLabelIdx < labelEvents.length) {
        const ev = labelEvents[currentLabelIdx];
        if (timeInSeconds >= ev.start_time && timeInSeconds < ev.end_time) {
            showText(ev.description);
            return;
        }
    }

    // Linear scan (events are sorted, typically 1-6 items)
    for (let i = 0; i < labelEvents.length; i++) {
        const ev = labelEvents[i];
        if (timeInSeconds >= ev.start_time && timeInSeconds < ev.end_time) {
            currentLabelIdx = i;
            showText(ev.description);
            return;
        }
    }

    // No match
    currentLabelIdx = -1;
    if (overlayEl) overlayEl.style.display = 'none';
}

function showText(text: string) {
    if (!overlayEl || !textEl) return;
    textEl.textContent = text;
    overlayEl.style.display = '';
}

function renderLabelSegments() {
    const container = document.getElementById('temporalLabelSegments');
    if (!container) return;

    container.innerHTML = '';

    if (!labelEvents || labelEvents.length === 0 || !g.MODEL3D?.anim) {
        container.style.display = 'none';
        return;
    }

    const totalDuration = g.MODEL3D.anim.maxFrame / g.MODEL3D.anim.fps;
    if (totalDuration <= 0) {
        container.style.display = 'none';
        return;
    }

    const RADIUS = 10; // pill border-radius (fully rounded ends)

    for (let i = 0; i < labelEvents.length; i++) {
        const ev = labelEvents[i];
        const left = (ev.start_time / totalDuration) * 100;
        const width = ((ev.end_time - ev.start_time) / totalDuration) * 100;

        const borderRadius = `${RADIUS}px`;

        const seg = document.createElement('div');
        Object.assign(seg.style, {
            position: 'absolute',
            left: `${left}%`,
            width: `${width}%`,
            top: '0',
            height: '100%',
            borderRadius,
            background: 'var(--theme-label-segment-bg)',
            boxSizing: 'border-box',
        });
        container.appendChild(seg);
    }

    container.style.display = 'block';
}

export function fetchTemporalLabels(moveOrgName: string) {
    const version = ++fetchVersion;
    labelEvents = null;
    currentLabelIdx = -1;

    renderLabelSegments(); // clear old segments immediately

    if (!moveOrgName) return;

    fetch(`${g.BACKEND_URL}/storage_local/temporal_labels/?move_org_name=${encodeURIComponent(moveOrgName)}`)
        .then(res => {
            if (!res.ok) return null;
            return res.json();
        })
        .then(data => {
            if (version !== fetchVersion) return; // stale response, discard
            if (data && data.events) {
                labelEvents = data.events;
            }
            renderLabelSegments();
        })
        .catch(() => {
            // Silently ignore — temporal labels are optional
        });
}

export function toggleTemporalLabels() {
    labelsEnabled = !labelsEnabled;
    if (!labelsEnabled) {
        if (overlayEl) overlayEl.style.display = 'none';
    }
    // Update button visual
    const btn = document.getElementById('temporalLabelButton');
    if (btn) {
        if (labelsEnabled) {
            btn.classList.add('text-gray-700');
        } else {
            btn.classList.remove('text-gray-700');
        }
    }
}
