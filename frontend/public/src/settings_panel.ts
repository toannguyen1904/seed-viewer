import { g, MODEL_CONFIGS } from "./globals.ts";
import {
    LightingSettings,
    loadSettings,
    saveSettings,
    resetSettings,
    applyLightingSettings,
    applyAndRegenerateEnvMap,
} from "./lighting_settings.ts";

// @ts-ignore
import { regenerateEnvMap } from "./threejs_builtin.js";

let panelEl: HTMLElement | null = null;
let currentSettings: LightingSettings | null = null;
let sliderMap: Record<string, { input: HTMLInputElement; display: HTMLSpanElement }> = {};
let checkboxMap: Record<string, HTMLInputElement> = {};
let modelBadgeEl: HTMLElement | null = null;

// Section definitions for the panel
interface SliderDef {
    key: keyof LightingSettings;
    label: string;
    min: number;
    max: number;
    step: number;
}

interface CheckboxDef {
    key: keyof LightingSettings;
    label: string;
}

interface SectionDef {
    title: string;
    sliders: SliderDef[];
    checkboxes?: CheckboxDef[];
    hasRegenButton?: boolean;
}

const SECTIONS: SectionDef[] = [
    {
        title: "Hemisphere Light",
        sliders: [
            { key: "hemi_intensity", label: "Intensity", min: 0, max: 10, step: 0.05 },
            { key: "hemi_skyR", label: "Sky R", min: 0, max: 2, step: 0.01 },
            { key: "hemi_skyG", label: "Sky G", min: 0, max: 2, step: 0.01 },
            { key: "hemi_skyB", label: "Sky B", min: 0, max: 2, step: 0.01 },
            { key: "hemi_groundR", label: "Ground R", min: 0, max: 2, step: 0.01 },
            { key: "hemi_groundG", label: "Ground G", min: 0, max: 2, step: 0.01 },
            { key: "hemi_groundB", label: "Ground B", min: 0, max: 2, step: 0.01 },
        ],
    },
    {
        title: "Key Light",
        sliders: [
            { key: "key_intensity", label: "Intensity", min: 0, max: 10, step: 0.05 },
            { key: "key_colorR", label: "Color R", min: 0, max: 2, step: 0.01 },
            { key: "key_colorG", label: "Color G", min: 0, max: 2, step: 0.01 },
            { key: "key_colorB", label: "Color B", min: 0, max: 2, step: 0.01 },
            { key: "key_posX", label: "Pos X", min: -10, max: 10, step: 0.1 },
            { key: "key_posY", label: "Pos Y", min: -10, max: 10, step: 0.1 },
            { key: "key_posZ", label: "Pos Z", min: -10, max: 10, step: 0.1 },
        ],
    },
    {
        title: "Fill Light",
        sliders: [
            { key: "fill_intensity", label: "Intensity", min: 0, max: 10, step: 0.05 },
            { key: "fill_colorR", label: "Color R", min: 0, max: 2, step: 0.01 },
            { key: "fill_colorG", label: "Color G", min: 0, max: 2, step: 0.01 },
            { key: "fill_colorB", label: "Color B", min: 0, max: 2, step: 0.01 },
            { key: "fill_posX", label: "Pos X", min: -10, max: 10, step: 0.1 },
            { key: "fill_posY", label: "Pos Y", min: -10, max: 10, step: 0.1 },
            { key: "fill_posZ", label: "Pos Z", min: -10, max: 10, step: 0.1 },
        ],
    },
    {
        title: "Rim Light",
        sliders: [
            { key: "rim_intensity", label: "Intensity", min: 0, max: 10, step: 0.05 },
            { key: "rim_colorR", label: "Color R", min: 0, max: 2, step: 0.01 },
            { key: "rim_colorG", label: "Color G", min: 0, max: 2, step: 0.01 },
            { key: "rim_colorB", label: "Color B", min: 0, max: 2, step: 0.01 },
            { key: "rim_posX", label: "Pos X", min: -10, max: 10, step: 0.1 },
            { key: "rim_posY", label: "Pos Y", min: -10, max: 10, step: 0.1 },
            { key: "rim_posZ", label: "Pos Z", min: -10, max: 10, step: 0.1 },
        ],
    },
    {
        title: "Environment Map",
        hasRegenButton: true,
        checkboxes: [
            { key: "env_useHDR", label: "Use HDR Map" },
            { key: "env_showBackground", label: "Show Background" },
        ],
        sliders: [
            { key: "env_hdrIntensity", label: "HDR Int.", min: 0, max: 5, step: 0.01 },
            { key: "env_skyR", label: "Sky R", min: 0, max: 2, step: 0.01 },
            { key: "env_skyG", label: "Sky G", min: 0, max: 2, step: 0.01 },
            { key: "env_skyB", label: "Sky B", min: 0, max: 2, step: 0.01 },
            { key: "env_groundR", label: "Ground R", min: 0, max: 2, step: 0.01 },
            { key: "env_groundG", label: "Ground G", min: 0, max: 2, step: 0.01 },
            { key: "env_groundB", label: "Ground B", min: 0, max: 2, step: 0.01 },
            { key: "env_keySpotIntensity", label: "Key Spot", min: 0, max: 8, step: 0.1 },
            { key: "env_fillSpotIntensity", label: "Fill Spot", min: 0, max: 8, step: 0.1 },
        ],
    },
    {
        title: "Material — Body",
        sliders: [
            { key: "mat_bodyR", label: "Color R", min: 0, max: 1, step: 0.01 },
            { key: "mat_bodyG", label: "Color G", min: 0, max: 1, step: 0.01 },
            { key: "mat_bodyB", label: "Color B", min: 0, max: 1, step: 0.01 },
            { key: "mat_bodyMetalness", label: "Metalness", min: 0, max: 1, step: 0.01 },
            { key: "mat_bodyRoughness", label: "Roughness", min: 0, max: 1, step: 0.01 },
            { key: "mat_bodyEnvMapIntensity", label: "Env Map", min: 0, max: 3, step: 0.01 },
        ],
    },
    {
        title: "Material — Dark",
        sliders: [
            { key: "mat_darkR", label: "Color R", min: 0, max: 1, step: 0.01 },
            { key: "mat_darkG", label: "Color G", min: 0, max: 1, step: 0.01 },
            { key: "mat_darkB", label: "Color B", min: 0, max: 1, step: 0.01 },
            { key: "mat_darkMetalness", label: "Metalness", min: 0, max: 1, step: 0.01 },
            { key: "mat_darkRoughness", label: "Roughness", min: 0, max: 1, step: 0.01 },
            { key: "mat_darkEnvMapIntensity", label: "Env Map", min: 0, max: 3, step: 0.01 },
        ],
    },
    {
        title: "Post Processing",
        sliders: [
            { key: "toneMappingExposure", label: "Exposure", min: 0.1, max: 3, step: 0.01 },
            { key: "cssSaturate", label: "Saturate", min: 0, max: 2, step: 0.01 },
            { key: "cssContrast", label: "Contrast", min: 0, max: 2, step: 0.01 },
        ],
    },
];

export function initSettingsPanel(): void {
    const container = document.getElementById("settings-toggle")!;

    // Cog button
    const btn = document.createElement("div");
    btn.id = "settings-cog-btn";
    btn.title = "Lighting Settings";
    btn.style.cssText = `
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
        transition: background 0.15s;
    `;

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "settings";
    icon.style.cssText = "font-size: 24px; color: var(--theme-text-muted); pointer-events: none;";
    btn.appendChild(icon);

    btn.addEventListener("mouseenter", () => {
        btn.style.background = "var(--theme-accent-hover)";
        icon.style.color = "var(--theme-text-primary)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "var(--theme-btn-bg)";
        icon.style.color = "var(--theme-text-muted)";
    });
    btn.addEventListener("click", () => togglePanel());

    container.appendChild(btn);
}

function togglePanel(): void {
    if (panelEl) {
        closePanel();
    } else {
        openPanel();
    }
}

function openPanel(): void {
    if (panelEl) return;

    currentSettings = loadSettings(g.CURRENT_MODEL);
    sliderMap = {};
    checkboxMap = {};

    const panel = document.createElement("div");
    panel.id = "lighting-settings-panel";
    panel.style.cssText = `
        position: absolute;
        top: 48px;
        right: 24px;
        width: 280px;
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        background: var(--theme-panel-bg-frosted);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 8px;
        box-shadow: 0 4px 24px var(--theme-shadow);
        border: 1px solid var(--theme-btn-border-light);
        z-index: 60;
        pointer-events: auto;
        font-size: 11px;
        color: var(--theme-text-primary);
    `;

    // Stop pointer events from reaching OrbitControls
    panel.addEventListener("pointerdown", (e) => e.stopPropagation());
    panel.addEventListener("wheel", (e) => e.stopPropagation());

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        padding: 10px 12px 8px; border-bottom: 1px solid var(--theme-panel-border-medium);
        position: sticky; top: 0; background: var(--theme-panel-bg-frosted);
        backdrop-filter: blur(12px); z-index: 1;
    `;

    const titleEl = document.createElement("span");
    titleEl.textContent = "Lighting";
    titleEl.style.cssText = "font-weight: 600; font-size: 13px; flex-shrink: 0;";
    header.appendChild(titleEl);

    modelBadgeEl = document.createElement("span");
    modelBadgeEl.style.cssText = `
        font-size: 10px; font-weight: 600; padding: 1px 6px;
        border-radius: 3px; background: var(--theme-accent); color: var(--theme-text-primary);
    `;
    modelBadgeEl.textContent = MODEL_CONFIGS[g.CURRENT_MODEL].name;
    header.appendChild(modelBadgeEl);

    // Spacer
    const spacer = document.createElement("span");
    spacer.style.cssText = "flex: 1;";
    header.appendChild(spacer);

    // Reset button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.title = "Reset to defaults for this model";
    resetBtn.style.cssText = `
        font-size: 10px; padding: 2px 8px; border-radius: 3px;
        border: 1px solid var(--theme-btn-border); background: var(--theme-panel-bg);
        cursor: pointer; color: var(--theme-text-secondary); flex-shrink: 0;
    `;
    resetBtn.addEventListener("click", () => {
        currentSettings = resetSettings(g.CURRENT_MODEL);
        applyAndRegenerateEnvMap(currentSettings);
        updateAllSliders();
    });
    header.appendChild(resetBtn);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Close";
    closeBtn.style.cssText = `
        font-size: 16px; line-height: 1; padding: 0 4px;
        border: none; background: none; cursor: pointer; color: var(--theme-text-faint);
        flex-shrink: 0;
    `;
    closeBtn.addEventListener("click", () => closePanel());
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Sections
    for (const section of SECTIONS) {
        panel.appendChild(buildSection(section));
    }

    // Mount into right-pane-up (same parent as the canvas)
    const mount = document.getElementById("right-pane-up")!;
    mount.appendChild(panel);
    panelEl = panel;
}

function closePanel(): void {
    if (panelEl) {
        panelEl.remove();
        panelEl = null;
    }
}

function buildSection(section: SectionDef): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "border-bottom: 1px solid var(--theme-panel-border-light);";

    // Section header (collapsible)
    const sectionHeader = document.createElement("div");
    sectionHeader.style.cssText = `
        display: flex; align-items: center; padding: 7px 12px;
        cursor: pointer; user-select: none;
    `;

    const chevron = document.createElement("span");
    chevron.textContent = "\u25B6";
    chevron.style.cssText = "font-size: 8px; margin-right: 6px; transition: transform 0.15s; color: var(--theme-text-faint);";

    const sTitle = document.createElement("span");
    sTitle.textContent = section.title;
    sTitle.style.cssText = "font-weight: 600; font-size: 11px;";

    sectionHeader.appendChild(chevron);
    sectionHeader.appendChild(sTitle);

    const content = document.createElement("div");
    content.style.cssText = "padding: 0 12px 8px; display: none;";

    let open = false;
    sectionHeader.addEventListener("click", () => {
        open = !open;
        content.style.display = open ? "block" : "none";
        chevron.style.transform = open ? "rotate(90deg)" : "rotate(0deg)";
    });

    wrapper.appendChild(sectionHeader);

    // Checkboxes
    if (section.checkboxes) {
        for (const cb of section.checkboxes) {
            content.appendChild(buildCheckbox(cb));
        }
    }

    // Sliders
    for (const slider of section.sliders) {
        content.appendChild(buildSlider(slider));
    }

    // Regenerate button for env map section
    if (section.hasRegenButton) {
        const regenBtn = document.createElement("button");
        regenBtn.textContent = "Regenerate Env Map";
        regenBtn.style.cssText = `
            margin-top: 6px; width: 100%; padding: 4px 0;
            font-size: 10px; font-weight: 600; border-radius: 4px;
            border: 1px solid var(--theme-btn-border); background: var(--theme-regen-btn-bg);
            cursor: pointer; color: var(--theme-text-secondary);
        `;
        regenBtn.addEventListener("click", () => {
            if (!currentSettings) return;
            regenerateEnvMap(
                [currentSettings.env_skyR, currentSettings.env_skyG, currentSettings.env_skyB],
                [currentSettings.env_groundR, currentSettings.env_groundG, currentSettings.env_groundB],
                currentSettings.env_keySpotIntensity,
                currentSettings.env_fillSpotIntensity,
            );
        });
        content.appendChild(regenBtn);
    }

    wrapper.appendChild(content);
    return wrapper;
}

function buildSlider(def: SliderDef): HTMLElement {
    const row = document.createElement("div");
    row.style.cssText = "display: flex; align-items: center; gap: 4px; margin-top: 4px;";

    const label = document.createElement("span");
    label.textContent = def.label;
    label.style.cssText = "width: 56px; flex-shrink: 0; font-size: 10px; color: var(--theme-text-secondary);";

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(def.min);
    input.max = String(def.max);
    input.step = String(def.step);
    input.value = String(currentSettings ? (currentSettings[def.key] as number) : 0);
    input.style.cssText = "flex: 1; height: 14px; accent-color: var(--theme-text-secondary); cursor: pointer;";

    const display = document.createElement("span");
    display.textContent = formatVal(Number(input.value));
    display.style.cssText = "width: 32px; text-align: right; font-size: 10px; color: var(--theme-text-muted); font-variant-numeric: tabular-nums;";

    // Env map sliders don't live-update (too expensive); HDR intensity is cheap though
    const isEnvParam = (def.key as string).startsWith("env_") && def.key !== "env_hdrIntensity";

    input.addEventListener("input", () => {
        const val = Number(input.value);
        display.textContent = formatVal(val);
        if (currentSettings) {
            (currentSettings as any)[def.key] = val;
            saveSettings(g.CURRENT_MODEL, currentSettings);
            if (!isEnvParam) {
                applyLightingSettings(currentSettings);
            }
        }
    });

    sliderMap[def.key] = { input, display };

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(display);
    return row;
}

function buildCheckbox(def: CheckboxDef): HTMLElement {
    const row = document.createElement("div");
    row.style.cssText = "display: flex; align-items: center; gap: 6px; margin-top: 4px;";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!(currentSettings ? (currentSettings[def.key] as number) : 0);
    input.style.cssText = "accent-color: var(--theme-text-secondary); cursor: pointer; width: 14px; height: 14px;";

    const label = document.createElement("span");
    label.textContent = def.label;
    label.style.cssText = "font-size: 10px; color: var(--theme-text-secondary); cursor: pointer;";
    label.addEventListener("click", () => { input.click(); });

    input.addEventListener("change", () => {
        if (currentSettings) {
            (currentSettings as any)[def.key] = input.checked ? 1 : 0;
            saveSettings(g.CURRENT_MODEL, currentSettings);
            if (def.key === "env_useHDR") {
                applyAndRegenerateEnvMap(currentSettings);
            } else {
                applyLightingSettings(currentSettings);
            }
        }
    });

    checkboxMap[def.key] = input;

    row.appendChild(input);
    row.appendChild(label);
    return row;
}

function formatVal(v: number): string {
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
}

function updateAllSliders(): void {
    if (!currentSettings) return;
    for (const [key, { input, display }] of Object.entries(sliderMap)) {
        const val = (currentSettings as any)[key] as number;
        input.value = String(val);
        display.textContent = formatVal(val);
    }
    for (const [key, input] of Object.entries(checkboxMap)) {
        input.checked = !!((currentSettings as any)[key] as number);
    }
}

export function refreshSettingsPanel(): void {
    if (!panelEl) return;
    currentSettings = loadSettings(g.CURRENT_MODEL);
    if (modelBadgeEl) {
        modelBadgeEl.textContent = MODEL_CONFIGS[g.CURRENT_MODEL].name;
    }
    updateAllSliders();
}
