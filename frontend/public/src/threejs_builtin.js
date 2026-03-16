import { g } from './globals.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { resizeViewport } from './viewport.ts';
import { loadSettings, applyLightingSettings } from './lighting_settings.ts';
// @ts-ignore
import HdrUrl from "/images/cayley_interior_4k.hdr";

const COLOR_PALETTE = {
  dark: {
    background: new THREE.Color("hsl(0, 0%, 20%)"),
    grid: new THREE.Color("hsl(0, 0%, 25%)"),
    grid2: new THREE.Color("hsl(0, 0%, 22%)"),
    floor: new THREE.Color("hsl(0, 0%, 20%)"),
  },
  light: {
    background: 0xffffff,
    grid: new THREE.Color("hsl(0, 0%, 88%)"),
    grid2: new THREE.Color("hsl(0, 0%, 90%)"),
    floor: new THREE.Color("hsl(0, 0%, 85%)"),
  }
};
const THEME = "light";



export function initScene(canvasDomElement) {



  //// FPS COUNTER
  const stats = new Stats();
  g.STATS = stats;
  document.body.appendChild(stats.dom);
  stats.dom.classList.add("hidden");



  //// SCENE
  const scene = new THREE.Scene();
  g.SCENE = scene;



  //// RENDERER
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvasDomElement,
    // detect url paremeter
    preserveDrawingBuffer: g.URL_PARAMS.has("preserveDrawingBuffer"),
  });
  g.RENDERER = renderer;
  renderer.setPixelRatio(1);
  // renderer.setSize(window.innerWidth, window.innerHeight, false);
  // document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  THREE.ColorManagement.enabled = true;
  // renderer.outputColorSpace = "srgb-linear" ; // optional with post-processing
  renderer.outputColorSpace = "srgb"
  renderer.toneMapping = THREE.CineonToneMapping;

  // renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  // renderer.toneMapping
  // renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  // renderer.toneMappingExposure = 0.5;
  // renderer.toneMapping = THREE.LinearToneMapping;
  // change saturation of renderer.domElement
  renderer.domElement.style.filter = "saturate(0.9) contrast(1)";
  renderer.setClearColor(COLOR_PALETTE[THEME].background, 1);



  //// FOG
  scene.fog = new THREE.Fog(COLOR_PALETTE[THEME].background, 10, 30);



  //// GRID HELPER
  const size = 100;
  const divisions = 120;
  const gridColor = new THREE.Color(COLOR_PALETTE[THEME].grid);
  const gridColor2 = new THREE.Color(COLOR_PALETTE[THEME].grid2);
  const gridHelper = new THREE.GridHelper(size, divisions, gridColor, gridColor2);
  const floorOffset = -0.0;
  gridHelper.translateY(floorOffset);
  scene.add(gridHelper);



  //// AXES HELPER
  const axesHelper = new THREE.AxesHelper(0.2);
  axesHelper.position.set(0, 0.01, 0);
  scene.add(axesHelper);



  //// CAMERA AND CONTROLS
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  let cameraDistanceMult = 1;
  if (g.URL_PARAMS.has("cameraDistanceMult")) {
    console.log("[URL_PARAM] cameraDistanceMult", g.URL_PARAMS.get("cameraDistanceMult"));
    cameraDistanceMult = Number(g.URL_PARAMS.get("cameraDistanceMult"));
  }
  camera.position.set(2 * cameraDistanceMult, 1.5 * cameraDistanceMult, 2 * cameraDistanceMult);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.zoomSpeed = 20;
  controls.target.set(0, 1, 0);
  g.CAMCON = new CameraAndControls(camera, controls, true);



  ////CLOCK
  const clock = new THREE.Clock();
  g.CLOCK = clock;
  g.DELTA_TIME = 0;



  //// LIGHTS
  const hemisphereLight = new THREE.HemisphereLight(new THREE.Color("hsl(192, 0%, 100%)"), new THREE.Color("hsl(72, 0%, 60%)"), 5);
  scene.add(hemisphereLight);
  g.HEMISPHERE_LIGHT = hemisphereLight;

  const directionalLight = new THREE.DirectionalLight(new THREE.Color("hsl(72, 60%, 100%)"), 2);
  directionalLight.position.set(0, 5, 0);
  scene.add(directionalLight);

  const shadowRes = 1024 * 1;
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = shadowRes;
  directionalLight.shadow.mapSize.height = shadowRes;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 10;
  const d = 10
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  g.DIRECTIONAL_LIGHT = directionalLight;

  // Fill light (off by default for Bones, enabled for G1)
  const fillLight = new THREE.DirectionalLight(new THREE.Color("hsl(210, 20%, 100%)"), 0);
  fillLight.position.set(3, 3, -2);
  scene.add(fillLight);
  g.FILL_LIGHT = fillLight;

  // Rim / back light (off by default, enabled for G1)
  const rimLight = new THREE.DirectionalLight(new THREE.Color(0.85, 0.93, 1.0), 0);
  rimLight.position.set(2, 3, -4);
  scene.add(rimLight);
  g.RIM_LIGHT = rimLight;

  //// ENVIRONMENT MAP — initial generation with SOMA/Bones defaults
  regenerateEnvMap([1.0, 1.0, 1.0], [0.7, 0.7, 0.75], 3.5, 1.5);

  //// FLOOR
  let floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({
    color: COLOR_PALETTE[THEME].floor,
    depthWrite: true,
    dithering: true,
  }));
  scene.add(floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.position.y = floorOffset;
}



class CameraAndControls {
  constructor(camera, controls, follow = true) {
    this.camera = camera;
    this.controls = controls;
    this.following = follow;

    // Store perspective settings for switching
    this.fov = camera.fov;
    this.aspect = camera.aspect;
    this.near = camera.near;
    this.far = camera.far;

    // max distance from target
    this.controls.maxDistance = 20;

    // scroll zoom speed
    this.controls.zoomSpeed = 1;
  }

  followTarget(target, damp = false) {
    // get offset from OribtalControls target to root bone
    const offset = new THREE.Vector3().subVectors(target, this.controls.target);

    if (damp) {
      let multiplier = g.DELTA_TIME * 10;
      offset.multiplyScalar(multiplier)
    }

    // lerp Orbital controls target and camera to root bone by the same amount
    this.controls.target.add(offset);
    this.camera.position.add(offset);
  }

  /** Switch between perspective and orthographic projection */
  switchProjection() {
    const pos = this.camera.position.clone();
    const targetPos = this.controls.target.clone();
    const up = this.camera.up.clone();
    const distance = pos.distanceTo(targetPos);

    if (this.camera.isPerspectiveCamera) {
      // Perspective -> Orthographic
      // Compute frustum height to match perspective view at current distance
      const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
      const halfWidth = halfHeight * this.aspect;

      const orthoCamera = new THREE.OrthographicCamera(
        -halfWidth, halfWidth,
        halfHeight, -halfHeight,
        this.near, this.far
      );
      orthoCamera.position.copy(pos);
      orthoCamera.up.copy(up);
      orthoCamera.lookAt(targetPos);

      this.camera = orthoCamera;
    } else {
      // Orthographic -> Perspective
      const perspCamera = new THREE.PerspectiveCamera(
        this.fov, this.aspect, this.near, this.far
      );
      perspCamera.position.copy(pos);
      perspCamera.up.copy(up);
      perspCamera.lookAt(targetPos);

      this.camera = perspCamera;
    }

    // Recreate controls with new camera
    const oldTarget = this.controls.target.clone();
    this.controls.dispose();
    this.controls = new OrbitControls(this.camera, g.RENDERER.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.maxDistance = 20;
    this.controls.zoomSpeed = 1;
    this.controls.target.copy(oldTarget);
    this.controls.update();
  }

  /** Update aspect/frustum on resize */
  updateAspect(width, height) {
    this.aspect = width / height;
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = this.aspect;
    } else {
      // Orthographic – keep current frustum height, adjust width
      const frustumHeight = (this.camera.top - this.camera.bottom);
      const halfWidth = (frustumHeight * this.aspect) / 2;
      this.camera.left = -halfWidth;
      this.camera.right = halfWidth;
    }
    this.camera.updateProjectionMatrix();
  }
}


/**
 * Regenerate the procedural environment map with custom colours.
 * Call sparingly — PMREMGenerator is expensive.
 */
export function regenerateEnvMap(skyColor, groundColor, keySpotIntensity, fillSpotIntensity) {
  const renderer = g.RENDERER;
  const scene = g.SCENE;
  if (!renderer || !scene) return;

  // Dispose previous env map
  if (scene.environment) {
    scene.environment.dispose();
    scene.environment = null;
  }

  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();

  const envScene = new THREE.Scene();

  // Sky dome — upper hemisphere
  const skyGeo = new THREE.SphereGeometry(50, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(skyColor[0], skyColor[1], skyColor[2]),
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  // Ground dome — lower hemisphere
  const gndGeo = new THREE.SphereGeometry(50, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const gndMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(groundColor[0], groundColor[1], groundColor[2]),
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(gndGeo, gndMat));

  // Key light spot
  const spotGeo = new THREE.CircleGeometry(8, 16);
  const kI = keySpotIntensity;
  const spotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(kI, kI, kI) });
  const spot = new THREE.Mesh(spotGeo, spotMat);
  spot.position.set(-15, 30, 15);
  spot.lookAt(0, 0, 0);
  envScene.add(spot);

  // Fill light spot
  const fI = fillSpotIntensity;
  const spot2 = new THREE.Mesh(spotGeo.clone(), new THREE.MeshBasicMaterial({ color: new THREE.Color(fI, fI, fI * 1.13) }));
  spot2.position.set(20, 15, -10);
  spot2.lookAt(0, 0, 0);
  envScene.add(spot2);

  const envMap = pmremGen.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;

  // Clean up
  envScene.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  pmremGen.dispose();
}


/**
 * Load an HDR file as the environment map.
 * Cached after first load — subsequent calls just adjust intensity.
 */
let cachedHDRTexture = null;

export async function loadHDREnvMap(intensity) {
  const renderer = g.RENDERER;
  const scene = g.SCENE;
  if (!renderer || !scene) return;

  // Dispose previous env map
  if (scene.environment) {
    scene.environment.dispose();
    scene.environment = null;
  }

  if (!cachedHDRTexture) {
    const loader = new RGBELoader();
    cachedHDRTexture = await loader.loadAsync(HdrUrl);
  }

  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  const envMap = pmremGen.fromEquirectangular(cachedHDRTexture).texture;
  pmremGen.dispose();

  scene.environment = envMap;
  scene.environmentIntensity = intensity;
}


/**
 * Apply per-model scene settings (lights, camera position).
 * Called on model switch to ensure each model gets its own look.
 */
export async function applySceneForModel(modelType) {
  // Load persisted (or default) lighting settings and apply
  const s = loadSettings(modelType);
  applyLightingSettings(s);
  if (s.env_useHDR) {
    await loadHDREnvMap(s.env_hdrIntensity);
  } else {
    regenerateEnvMap(
      [s.env_skyR, s.env_skyG, s.env_skyB],
      [s.env_groundR, s.env_groundG, s.env_groundB],
      s.env_keySpotIntensity,
      s.env_fillSpotIntensity,
    );
  }
  // Apply background setting
  if (g.SCENE) {
    g.SCENE.background = s.env_showBackground ? g.SCENE.environment : null;
  }

}

