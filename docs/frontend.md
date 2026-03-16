# Frontend Architecture

The frontend is vanilla TypeScript + Three.js with no framework. Source lives in `frontend/public/src/`.

## Entry Points

- `index.html` → `main.ts` — Main 3D viewer with animation browser

## State Management

All shared state flows through `globals.ts`, which exports a single `g` object:

```typescript
g.RENDERER    // Three.js WebGLRenderer
g.SCENE       // Three.js Scene
g.CAMERA      // Three.js Camera (via g.CAMCON)
g.CONTROLS    // OrbitControls
g.MODEL3D     // Current Model3D or Model3DG1 instance
g.ANIMATION   // Current Animation object
g.FRAME       // Current frame number (can be fractional)
g.PLAYING     // Playback state
g.LOOP_START  // Loop range start frame
g.LOOP_END    // Loop range end frame
g.CURRENT_MODEL // 'soma' | 'g1'
g.UPDATE_LOOP // Dict of callbacks run every frame
g.SPINNER     // Loading spinner instance
g.BACKEND_URL // API base URL ("/api")
g.HEMISPHERE_LIGHT  // Scene hemisphere light
g.DIRECTIONAL_LIGHT // Key directional light
g.FILL_LIGHT        // Fill directional light
g.RIM_LIGHT         // Rim directional light
```

Modules import `g` directly — there is no pub/sub or event bus.

## Initialization Flow (`main.ts`)

1. `initSpinner()` — show loading screen
2. `initScene(canvas)` — Three.js scene, renderer, camera, lights, grid
3. `applySceneForModel()` — load saved lighting settings for default model
4. UI initialization: download button, model selector, view cube, projection toggle, settings panel, metadata viewer
5. `init3DModel()` — load the default SOMA FBX model
6. SOMA/G1 auto-load the first animation from the browser table after metadata is fetched.
7. `initTimeline()`, `initBrowser()`, `initDivider()` — playback + browser UI. `getTablePage()` auto-loads the first animation if none is loaded.
8. Add model to scene, start `animate()` loop, hide loading screen

## Render Loop

`animate()` in `main.ts` runs via `requestAnimationFrame`:

1. Compute `DELTA_TIME` from clock
2. If model + animation loaded: call `MODEL3D.setFrame(FRAME)`
3. If playing: advance `FRAME` by `DELTA_TIME * fps`, loop within `LOOP_START/END`
4. If camera following: track root bone position
5. Execute all `UPDATE_LOOP` callbacks (includes view cube animation when active)
6. Update controls (skipped during view cube animation via `_viewCubeAnimating` flag), stats, view cube
7. Render scene

## Module Map

### Core Rendering
| File | Purpose |
|------|---------|
| `threejs_builtin.js` | Scene setup: renderer, camera, 4 lights (hemisphere, key, fill, rim), grid, fog, stats, env map generation, HDR loading, `applySceneForModel()` (lighting/env only, no camera positioning) |
| `viewport.ts` | Canvas resize handling (`resizeViewport()`) |
| `customSkeletonHelper.js` | `SkeletonHelper2` (SOMA) and `JointHelper` (G1) for skeleton visualization |

### Models & Animation
| File | Purpose |
|------|---------|
| `globals.ts` | `MODEL_CONFIGS`, `ModelType`, `ModelConfig` interface |
| `models.ts` | `Model3D` (SOMA), `Model3DG1` (G1), `init3DModel()`, `disposeModel3D()` |
| `animation.ts` | `Animation` class (BVH), `loadBVHUrl()`, `loadBVHString()` |
| `g1_animation.ts` | `G1Animation` class (CSV), `loadG1CSVString()` |
| `model_selector.ts` | Pill-shaped model switching dropdown with "Model:" label, preserves animation + button states across switches |

### Lighting & Materials
| File | Purpose |
|------|---------|
| `lighting_settings.ts` | Per-model lighting defaults, `LightingSettings` interface, localStorage persistence, `applyLightingSettings()`, `applyMaterialSettings()` |
| `settings_panel.ts` | Floating cog-button settings panel with sliders for all lighting/material parameters |
| `flakes_texture.ts` | Procedural 512x512 FlakesTexture canvas for SOMA normal maps |

### File Browser (`browser/` directory)
| File | Purpose |
|------|---------|
| `initBrowser.ts` | Entry point — creates browser table and wires everything up |
| `__types.ts` | Browser-specific TypeScript types |
| `__localGlobals.ts` | Browser state (current page, query, sort settings) |
| `__createLocalFilesBrowser.ts` | Renders the browser table rows |
| `__getMetadataPage.ts` | Fetches paginated metadata from backend |
| `__updateCurrentPage.ts` | Page navigation logic |
| `__updateMaxPages.ts` | Total page count calculation |
| `__refreshBrowserTable.ts` | Re-renders table after state change |
| `__loadAnimFromSelectedRow.ts` | Handles row click → loads animation |
| `__requestBVH.ts` | Dispatches animation fetch (BVH or CSV) based on current model, triggers temporal label fetch |
| `__loadRandomAnim.ts` | Loads a random animation |

### UI Components
| File | Purpose |
|------|---------|
| `timeline.js` | Play/pause, frame slider, skeleton toggle (stick figure icon), follow camera toggle, subtitle (CC) toggle |
| `divider.ts` | Resizable pane divider between viewport and browser |
| `view_cube.ts` | Interactive 3D navigation cube with axis-aligned camera views, arrow buttons for adjacent face navigation, quaternion slerp animation (gimbal-lock free). Animation runs inside `UPDATE_LOOP` to stay in sync with follow-camera. Uses `_viewCubeAnimating` flag to suppress `controls.update()` during transitions. |
| `projection_toggle.ts` | Orthographic/perspective camera toggle with inline SVG icons |
| `metadata_viewer.ts` | Displays metadata for selected animation |
| `spinner.ts` | Loading spinner show/hide |
| `download_anim.ts` | Download current animation file |
| `temporal_labels.ts` | Movie-style subtitle overlay synced to animation playback. Fetches temporal label events from backend, displays matching event for current frame time. Toggled via CC button on timeline bar. Uses `UPDATE_LOOP` callback and a fetch version counter to prevent stale responses from race conditions. |
| `helpers.ts` | Utilities: quaternion math, cookie handling, `isOk()` fetch validation |

## Lighting Settings System

Each model type has independent lighting defaults defined in `lighting_settings.ts`. Settings are persisted to `localStorage` keyed by model type (`viewer_lighting_soma`, `viewer_lighting_g1`).

### Settings Include

- **Hemisphere light**: intensity, sky/ground colors
- **Key/Fill/Rim directional lights**: intensity, color, position
- **Environment map**: procedural sky/ground colors, spot intensities, or HDR file with intensity multiplier
- **Post-processing**: tone mapping exposure, CSS saturate/contrast
- **Body material**: color, metalness, roughness, envMapIntensity, clearcoat, clearcoatRoughness, normalScale
- **Dark-part material**: same params for dark mesh parts (head, hands, ankles, hips)

### Version Migration

Each defaults object has a `version` field. When loading saved settings, if the saved version doesn't match the defaults version, the saved settings are discarded and defaults are used. Bump the version when changing defaults to force a reset.

### Settings Panel UI

The floating panel (cog icon in the toolbar) provides real-time sliders for all parameters. Changes apply immediately via `applyLightingSettings()` and auto-save to localStorage. The "Reset" button reverts to defaults. The "Regenerate" button in the environment map section rebuilds the PMREMGenerator env map (too expensive for per-slider updates).

## Toolbar Layout

The upper-right toolbar in `index.html` uses a `#controls-row` flex container grouping model selector, projection toggle, and settings button in a single horizontal row. All three share a consistent pill style: `rgba(240,240,240,0.92)` background, `border-radius: 8px`, teal hover (`rgba(100,200,220,0.9)` with white text/icons). The view cube sits below the controls row, and the download button is below that (hidden by default).
