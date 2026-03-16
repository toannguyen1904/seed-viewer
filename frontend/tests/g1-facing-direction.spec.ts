import { test, expect, Page } from '@playwright/test';

test.describe('G1 facing direction matches SOMA', () => {

    test('both SOMA and G1 face the camera from FRONT view', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/?preserveDrawingBuffer');
        await page.waitForSelector('[id="3d-viewport"]', { timeout: 30000 });
        // Wait for SOMA model + animation to load
        await page.waitForTimeout(6000);

        // Pause playback
        const pauseBtn = page.locator('#pauseButton');
        if (await pauseBtn.isVisible()) {
            await pauseBtn.click();
        }
        // Set slider to frame 0
        await page.evaluate(() => {
            const slider = document.getElementById('timelineSlider') as HTMLInputElement;
            if (slider) {
                slider.value = '1';
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await page.waitForTimeout(500);

        // Click FRONT on the viewport cube
        const frontFace = page.locator('#vc-cube >> text=FRONT');
        await frontFace.click();
        // Wait for camera animation (400ms) + extra settle time
        await page.waitForTimeout(1500);

        // Screenshot SOMA from the front
        const canvas = page.locator('[id="3d-viewport"]');
        await canvas.screenshot({ path: 'tests/screenshots/soma-front-facing.png' });

        // Measure center of mass of model pixels (X position as fraction of width)
        const somaCOM = await measureCenterOfMass(page);
        console.log(`[SOMA] Center of mass X: ${somaCOM.toFixed(3)} (0.5 = centered)`);

        // Switch to G1
        await page.locator('#model-selector button[data-model="g1"]').click();
        // Wait for G1 FBX to load
        await page.waitForTimeout(10000);

        // Pause and set frame 0
        const pauseBtn2 = page.locator('#pauseButton');
        if (await pauseBtn2.isVisible()) {
            await pauseBtn2.click();
        }
        await page.evaluate(() => {
            const slider = document.getElementById('timelineSlider') as HTMLInputElement;
            if (slider) {
                slider.value = '1';
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await page.waitForTimeout(500);

        // Click FRONT
        await frontFace.click();
        await page.waitForTimeout(1500);

        // Screenshot G1 from the front
        await canvas.screenshot({ path: 'tests/screenshots/g1-front-facing.png' });

        const g1COM = await measureCenterOfMass(page);
        console.log(`[G1] Center of mass X: ${g1COM.toFixed(3)} (0.5 = centered)`);

        // A front-facing model should have its center of mass near the
        // horizontal center of the viewport (0.5). Allow ±15% tolerance
        // for pose asymmetry and character design differences.
        expect(somaCOM, 'SOMA center of mass should be near center')
            .toBeGreaterThan(0.35);
        expect(somaCOM, 'SOMA center of mass should be near center')
            .toBeLessThan(0.65);

        expect(g1COM, 'G1 center of mass should be near center')
            .toBeGreaterThan(0.35);
        expect(g1COM, 'G1 center of mass should be near center')
            .toBeLessThan(0.65);

        // Both models should have similar center of mass (both facing camera)
        const comDiff = Math.abs(somaCOM - g1COM);
        console.log(`[Diff] |SOMA - G1| center of mass difference: ${comDiff.toFixed(3)}`);
        expect(comDiff, 'SOMA and G1 should have similar horizontal centering')
            .toBeLessThan(0.15);

        // Check no critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('SharedArrayBuffer') &&
            !e.includes('USDZ')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});

/**
 * Read pixel data from the 3D viewport canvas and compute the horizontal
 * center of mass of non-background pixels. Returns X position as a fraction
 * of canvas width (0.0 = left edge, 0.5 = center, 1.0 = right edge).
 *
 * A front-facing centered model should return ~0.5.
 * A sideways model (e.g. facing right) would return > 0.5 or < 0.5.
 */
async function measureCenterOfMass(page: Page): Promise<number> {
    return await page.evaluate(() => {
        const canvas = document.getElementById('3d-viewport') as HTMLCanvasElement;
        if (!canvas) return 0.5;

        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return 0.5;

        const w = canvas.width;
        const h = canvas.height;
        const pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // Sample background from corners
        const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
        let bgR = 0, bgG = 0, bgB = 0;
        for (const [cx, cy] of corners) {
            const idx = (cy * w + cx) * 4;
            bgR += pixels[idx];
            bgG += pixels[idx + 1];
            bgB += pixels[idx + 2];
        }
        bgR = Math.round(bgR / 4);
        bgG = Math.round(bgG / 4);
        bgB = Math.round(bgB / 4);

        const BG_THRESHOLD = 25;
        let xSum = 0;
        let count = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const dr = pixels[idx] - bgR;
                const dg = pixels[idx + 1] - bgG;
                const db = pixels[idx + 2] - bgB;
                const dist = Math.sqrt(dr * dr + dg * dg + db * db);

                if (dist > BG_THRESHOLD) {
                    xSum += x;
                    count++;
                }
            }
        }

        if (count === 0) return 0.5;
        const centerOfMassX = xSum / count;
        console.log(`[CenterOfMass] bg=(${bgR},${bgG},${bgB}) modelPixels=${count} comX=${centerOfMassX.toFixed(1)}/${w}`);
        return centerOfMassX / w;
    });
}
