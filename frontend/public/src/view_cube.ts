import { g } from './globals.ts';
import * as THREE from 'three';

const CUBE_SIZE = 60; // px
const HALF = CUBE_SIZE / 2;
const SCENE_SIZE = 92; // px — larger to hold arrows around the cube
const SCENE_PAD = (SCENE_SIZE - CUBE_SIZE) / 2; // 16px margin for arrows
const ANIM_DURATION = 400; // ms
const ACTIVE_THRESHOLD = 0.95; // dot product threshold for "near a face"

// Face definitions: short label, camera direction, up vector, CSS transform
// dir = where the camera goes (relative to orbit target), up = camera.up after animation.
// TOP/BOT use a small Z offset (0.01) to avoid the polar singularity of OrbitControls,
// and keep up=(0,1,0) so orbiting works normally after landing.
// The animation uses camera.lookAt() (not controls.update()) to avoid OrbitControls'
// internal state causing random azimuthal orientation at the poles.
const FACES: { label: string; dir: THREE.Vector3; up: THREE.Vector3; css: string }[] = [
    { label: 'FRONT',  dir: new THREE.Vector3(0, 0, 1),   up: new THREE.Vector3(0, 1, 0), css: `translateZ(${HALF}px)` },
    { label: 'BACK',   dir: new THREE.Vector3(0, 0, -1),  up: new THREE.Vector3(0, 1, 0), css: `rotateY(180deg) translateZ(${HALF}px)` },
    { label: 'RIGHT',  dir: new THREE.Vector3(1, 0, 0),   up: new THREE.Vector3(0, 1, 0), css: `rotateY(90deg) translateZ(${HALF}px)` },
    { label: 'LEFT',   dir: new THREE.Vector3(-1, 0, 0),  up: new THREE.Vector3(0, 1, 0), css: `rotateY(-90deg) translateZ(${HALF}px)` },
    { label: 'BOT',    dir: new THREE.Vector3(0, -1, 0.01), up: new THREE.Vector3(0, 1, 0), css: `rotateX(-90deg) translateZ(${HALF}px)` },
    { label: 'TOP',    dir: new THREE.Vector3(0, 1, 0.01),  up: new THREE.Vector3(0, 1, 0), css: `rotateX(90deg) translateZ(${HALF}px)` },
];

// Adjacency map: from each face label, which face is reached by going up/down/left/right
const ADJACENCY: Record<string, { up: string; down: string; left: string; right: string }> = {
    FRONT:  { up: 'TOP',   down: 'BOT',   left: 'LEFT',  right: 'RIGHT' },
    BACK:   { up: 'TOP',   down: 'BOT',   left: 'RIGHT', right: 'LEFT'  },
    RIGHT:  { up: 'TOP',   down: 'BOT',   left: 'FRONT', right: 'BACK'  },
    LEFT:   { up: 'TOP',   down: 'BOT',   left: 'BACK',  right: 'FRONT' },
    TOP:    { up: 'BACK',  down: 'FRONT', left: 'LEFT',  right: 'RIGHT' },
    BOT:    { up: 'FRONT', down: 'BACK',  left: 'LEFT',  right: 'RIGHT' },
};

const FACE_STYLE = `
    position: absolute;
    width: ${CUBE_SIZE}px;
    height: ${CUBE_SIZE}px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--theme-text-muted);
    background: var(--theme-btn-bg);
    border: 1px solid var(--theme-btn-border);
    backface-visibility: hidden;
    user-select: none;
    box-sizing: border-box;
    border-radius: 8px;
`;

let cubeEl: HTMLElement;
let activeFace = -1; // index into FACES, or -1 if camera is between faces
let mouseOver = false;

// Arrow elements: top, bottom, left, right
const arrowEls: HTMLElement[] = [];

// Arrow CSS border-triangle sizes
const ARROW_SIZE = 8; // px

export function initViewCube() {
    const container = document.getElementById('view-cube')!;

    container.innerHTML = `
    <div id="vc-scene" style="
        width: ${SCENE_SIZE}px;
        height: ${SCENE_SIZE}px;
        position: relative;
        perspective: 600px;
        cursor: pointer;
    ">
        <div id="vc-cube" style="
            width: ${CUBE_SIZE}px;
            height: ${CUBE_SIZE}px;
            position: absolute;
            top: ${SCENE_PAD}px;
            left: ${SCENE_PAD}px;
            transform-style: preserve-3d;
        "></div>
    </div>`;

    cubeEl = document.getElementById('vc-cube')!;
    const sceneEl = document.getElementById('vc-scene')!;

    // Build cube faces
    for (const face of FACES) {
        const el = document.createElement('div');
        el.textContent = face.label;
        el.style.cssText = FACE_STYLE + `transform: ${face.css};`;

        el.addEventListener('mouseenter', () => {
            el.style.background = 'var(--theme-accent-hover)';
            el.style.color = 'var(--theme-text-primary)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.background = 'var(--theme-btn-bg)';
            el.style.color = 'var(--theme-text-muted)';
        });
        el.addEventListener('click', () => {
            animateCameraToFace(face.dir, face.up);
        });

        cubeEl.appendChild(el);
    }

    // Build arrow elements (top, bottom, left, right)
    // Each arrow is a CSS border-triangle pointing inward toward the cube
    const arrowDefs: { pos: string; border: string; dir: 'up' | 'down' | 'left' | 'right' }[] = [
        {
            // Top arrow — triangle pointing down (inward)
            pos: `top: 0; left: 50%; transform: translateX(-50%);`,
            border: `border-left: ${ARROW_SIZE}px solid transparent; border-right: ${ARROW_SIZE}px solid transparent; border-top: ${ARROW_SIZE}px solid var(--theme-text-muted);`,
            dir: 'up',
        },
        {
            // Bottom arrow — triangle pointing up (inward)
            pos: `bottom: 0; left: 50%; transform: translateX(-50%);`,
            border: `border-left: ${ARROW_SIZE}px solid transparent; border-right: ${ARROW_SIZE}px solid transparent; border-bottom: ${ARROW_SIZE}px solid var(--theme-text-muted);`,
            dir: 'down',
        },
        {
            // Left arrow — triangle pointing right (inward)
            pos: `left: 0; top: 50%; transform: translateY(-50%);`,
            border: `border-top: ${ARROW_SIZE}px solid transparent; border-bottom: ${ARROW_SIZE}px solid transparent; border-left: ${ARROW_SIZE}px solid var(--theme-text-muted);`,
            dir: 'left',
        },
        {
            // Right arrow — triangle pointing left (inward)
            pos: `right: 0; top: 50%; transform: translateY(-50%);`,
            border: `border-top: ${ARROW_SIZE}px solid transparent; border-bottom: ${ARROW_SIZE}px solid transparent; border-right: ${ARROW_SIZE}px solid var(--theme-text-muted);`,
            dir: 'right',
        },
    ];

    for (const def of arrowDefs) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: absolute;
            ${def.pos}
            width: 0; height: 0;
            ${def.border}
            opacity: 0;
            transition: opacity 0.2s;
            cursor: pointer;
            z-index: 2;
        `;
        el.dataset.arrowDir = def.dir;

        // Hover highlight
        el.addEventListener('mouseenter', () => {
            setArrowColor(el, 'var(--theme-accent-hover)');
        });
        el.addEventListener('mouseleave', () => {
            setArrowColor(el, 'var(--theme-text-muted)');
        });

        // Click handler — navigate to adjacent face
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeFace < 0) return;
            const faceLabel = FACES[activeFace].label;
            const adj = ADJACENCY[faceLabel];
            if (!adj) return;
            const targetLabel = adj[def.dir];
            const targetFace = FACES.find(f => f.label === targetLabel);
            if (targetFace) {
                animateCameraToFace(targetFace.dir, targetFace.up);
            }
        });

        sceneEl.appendChild(el);
        arrowEls.push(el);
    }

    // Show/hide arrows on mouse enter/leave of the scene
    sceneEl.addEventListener('mouseenter', () => {
        mouseOver = true;
        updateArrowVisibility();
    });
    sceneEl.addEventListener('mouseleave', () => {
        mouseOver = false;
        updateArrowVisibility();
    });
}

/** Set the color of a border-triangle arrow */
function setArrowColor(el: HTMLElement, color: string) {
    const dir = el.dataset.arrowDir;
    if (dir === 'up') el.style.borderTopColor = color;
    else if (dir === 'down') el.style.borderBottomColor = color;
    else if (dir === 'left') el.style.borderLeftColor = color;
    else if (dir === 'right') el.style.borderRightColor = color;
}

/** Update arrow opacity based on mouse and active face state */
function updateArrowVisibility() {
    const show = mouseOver && activeFace >= 0;
    for (const el of arrowEls) {
        el.style.opacity = show ? '1' : '0';
        el.style.pointerEvents = show ? 'auto' : 'none';
    }
}

const _camDir = new THREE.Vector3();

/** Sync cube rotation with camera each frame */
export function updateViewCube() {
    if (!cubeEl || !g.CAMCON) return;

    const cam = g.CAMCON.camera;

    // Extract rotation-only portion of the camera's view matrix
    const m = new THREE.Matrix4().copy(cam.matrixWorldInverse);
    m.setPosition(0, 0, 0);

    const e = m.elements;
    // CSS Y-axis points down, Three.js Y-axis points up.
    // Apply S * R * S where S = diag(1,-1,1) to convert coordinate systems.
    // Elements where only row OR column is Y get negated (indices 1,4,6,9).
    // Element [1][1] (index 5) is negated twice → stays positive.
    cubeEl.style.transform =
        `matrix3d(${e[0]},${-e[1]},${e[2]},0,` +
        `${-e[4]},${e[5]},${-e[6]},0,` +
        `${e[8]},${-e[9]},${e[10]},0,` +
        `0,0,0,1)`;

    // Detect which face the camera is closest to (if any)
    cam.getWorldDirection(_camDir);
    // _camDir points FROM camera TOWARD target, but FACES[i].dir is the camera offset
    // direction (FROM target TOWARD camera). So we want -_camDir dot face.dir.
    let bestDot = -Infinity;
    let bestIdx = -1;
    for (let i = 0; i < FACES.length; i++) {
        const dot = -_camDir.dot(FACES[i].dir);
        if (dot > bestDot) {
            bestDot = dot;
            bestIdx = i;
        }
    }

    const prevActive = activeFace;
    activeFace = bestDot > ACTIVE_THRESHOLD ? bestIdx : -1;
    if (activeFace !== prevActive) {
        updateArrowVisibility();
    }
}

const _lerpOffset = new THREE.Vector3();

/** Animate camera to an axis-aligned view using quaternion slerp (gimbal-lock free).
 *  Runs inside the render loop's UPDATE_LOOP so it shares the same frame as
 *  followTarget() and updateViewCube(), avoiding one-frame-lag twists. */
function animateCameraToFace(direction: THREE.Vector3, up: THREE.Vector3) {
    const controls = g.CAMCON.controls;
    const distance = g.CAMCON.camera.position.distanceTo(controls.target);

    // Work with offsets from target (not absolute positions) so the animation
    // tracks a moving orbit target when the camera is following the character.
    const startOffset = g.CAMCON.camera.position.clone().sub(controls.target);
    const endOffset = direction.clone().multiplyScalar(distance);

    // End quaternion only depends on the camera-to-target direction (= -endOffset),
    // which is constant regardless of where the target moves.
    const endMat = new THREE.Matrix4().lookAt(endOffset, _zero, up);
    const endQuat = new THREE.Quaternion().setFromRotationMatrix(endMat);

    // Flush any residual OrbitControls damping deltas so they don't fight
    // the animation. Temporarily disable damping, call update() to zero out
    // the internal sphericalDelta, then restore.
    const wasDamping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = wasDamping;

    // Re-capture start state after flush (position may have shifted slightly)
    startOffset.copy(g.CAMCON.camera.position).sub(controls.target);
    const startQuat = g.CAMCON.camera.quaternion.clone();

    const startTime = performance.now();

    // Disable controls.update() in the render loop during animation.
    g.CAMCON._viewCubeAnimating = true;

    // Remove any previous animation callback (e.g. rapid face clicks)
    delete g.UPDATE_LOOP['__viewCubeAnim'];

    g.UPDATE_LOOP['__viewCubeAnim'] = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / ANIM_DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        // Lerp offset and add to CURRENT target (tracks moving target)
        _lerpOffset.lerpVectors(startOffset, endOffset, ease);
        g.CAMCON.camera.position.copy(controls.target).add(_lerpOffset);

        // Slerp quaternion (gimbal-lock free, smooth through poles)
        g.CAMCON.camera.quaternion.slerpQuaternions(startQuat, endQuat, ease);

        // Keep camera.up = (0,1,0) for OrbitControls compatibility after animation
        g.CAMCON.camera.up.set(0, 1, 0);

        if (t >= 1) {
            delete g.UPDATE_LOOP['__viewCubeAnim'];
            g.CAMCON._viewCubeAnimating = false;
            controls.update();
        }
    };
}

const _zero = new THREE.Vector3();
