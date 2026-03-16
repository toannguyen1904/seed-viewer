import {g} from "./globals.ts";

let RESIZE_DELAY_MS = 20;
let RESIZE_TIMEOUT: number | null = null;
let NEED_RESIZE = false;
let LAST_CANVAS_RESOLUTON = {width: 0, height: 0};

let TIME_UNCHANGED = 0;
const MAX_TIME_UNCHANGED = 1/5;

//// No idea why, but this setup gives this cool smooth resizing effect
export function resizeViewport() {
      const canvas = g.RENDERER.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      NEED_RESIZE = canvas.width !== width || canvas.height !== height;  

      const changed = LAST_CANVAS_RESOLUTON.width !== canvas.width || LAST_CANVAS_RESOLUTON.height !== canvas.height;
      TIME_UNCHANGED = changed ? 0 : TIME_UNCHANGED + g.DELTA_TIME;
      LAST_CANVAS_RESOLUTON = {width: canvas.width, height: canvas.height};

    if (TIME_UNCHANGED > MAX_TIME_UNCHANGED && NEED_RESIZE) {


      // if (RESIZE_TIMEOUT === null) {
          // window.clearTimeout(RESIZE_TIMEOUT);
          
        window.setTimeout(() => {
          g.RENDERER.setSize(width, height, false);
          if (g.CAMCON.updateAspect) {
            g.CAMCON.updateAspect(width, height);
          } else {
            g.CAMCON.camera.aspect = width / height;
            g.CAMCON.camera.updateProjectionMatrix();
          }
        }, RESIZE_DELAY_MS);
        // }

      TIME_UNCHANGED = 0;
    }
}


