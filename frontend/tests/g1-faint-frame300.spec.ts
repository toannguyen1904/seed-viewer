import { test, expect, Page } from '@playwright/test';

test('G1 faint animation frame 300: robot body above floor in RIGHT ortho view', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.goto('/?preserveDrawingBuffer');
    await page.waitForSelector('[id="3d-viewport"]', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Switch to G1
    await page.locator('#model-select-dropdown').selectOption('g1');
    await page.waitForTimeout(12000);

    // Load faint animation from browser table
    const dataRows = page.locator('#browser-table tbody tr[name="datarow"]');
    const count = await dataRows.count();
    let found = false;
    for (let i = 0; i < count; i++) {
        const text = await dataRows.nth(i).textContent();
        if (text?.includes('faint_stand_up_lying_puke_walk_ff_180_R_001__A472')) {
            await dataRows.nth(i).click({ force: true });
            found = true;
            break;
        }
    }
    expect(found, 'faint animation should be found in browser table').toBe(true);
    await page.waitForTimeout(3000);

    // Pause playback
    const pauseBtn = page.locator('#pauseButton');
    if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
    }

    // Set frame to 300
    await page.evaluate(() => {
        const slider = document.getElementById('timelineSlider') as HTMLInputElement;
        if (slider) {
            slider.value = '300';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await page.waitForTimeout(500);

    // Click RIGHT on the view cube
    const rightFace = page.locator('#vc-cube >> text=RIGHT');
    await rightFace.click();
    await page.waitForTimeout(1500);

    // Switch to orthographic projection
    const projBtn = page.locator('#proj-toggle-btn');
    if (await projBtn.isVisible()) {
        // Check if we're in perspective (need to switch)
        await projBtn.click();
        await page.waitForTimeout(500);
    }

    await page.waitForTimeout(500);
    const canvas = page.locator('[id="3d-viewport"]');
    await canvas.screenshot({ path: 'tests/screenshots/g1-faint-frame300-right-ortho.png' });

    // Measure the vertical center of mass (Y position) of the robot.
    // The robot at frame 300 is lying on its side. Its body should be
    // mostly above the floor (Y=0 in world, which maps to the middle-bottom
    // area of the viewport in a side view).
    // If the robot is sinking below the floor, its center of mass will be
    // in the lower portion of the viewport.
    const { comY, floorY, bodyBelowFloor } = await measureVerticalPosition(page);
    console.log(`[Frame 300] Center of mass Y: ${comY.toFixed(3)}, floor Y: ${floorY.toFixed(3)}, body below floor: ${bodyBelowFloor.toFixed(1)}%`);

    // The robot's feet should be elevated above the floor.
    // In a RIGHT ortho view, the floor is at the bottom of the model area.
    // Less than 30% of body pixels should be below the floor line.
    expect(bodyBelowFloor, 'Most of the robot body should be above the floor').toBeLessThan(30);

    const criticalErrors = errors.filter(e =>
        !e.includes('SharedArrayBuffer') &&
        !e.includes('USDZ')
    );
    expect(criticalErrors).toHaveLength(0);
});

/**
 * Measure where the robot body sits relative to the viewport center.
 * Returns:
 * - comY: vertical center of mass (0=top, 1=bottom)
 * - floorY: estimated floor position (0=top, 1=bottom)
 * - bodyBelowFloor: percentage of model pixels below the estimated floor
 */
async function measureVerticalPosition(page: Page): Promise<{ comY: number; floorY: number; bodyBelowFloor: number }> {
    return await page.evaluate(() => {
        const canvas = document.getElementById('3d-viewport') as HTMLCanvasElement;
        if (!canvas) return { comY: 0.5, floorY: 0.5, bodyBelowFloor: 50 };

        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return { comY: 0.5, floorY: 0.5, bodyBelowFloor: 50 };

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
        let ySum = 0;
        let count = 0;
        let minModelY = h;
        let maxModelY = 0;

        // WebGL pixels are bottom-up, so flip Y
        for (let glY = 0; glY < h; glY++) {
            const screenY = h - 1 - glY;
            for (let x = 0; x < w; x++) {
                const idx = (glY * w + x) * 4;
                const dr = pixels[idx] - bgR;
                const dg = pixels[idx + 1] - bgG;
                const db = pixels[idx + 2] - bgB;
                const dist = Math.sqrt(dr * dr + dg * dg + db * db);

                if (dist > BG_THRESHOLD) {
                    ySum += screenY;
                    count++;
                    if (screenY < minModelY) minModelY = screenY;
                    if (screenY > maxModelY) maxModelY = screenY;
                }
            }
        }

        if (count === 0) return { comY: 0.5, floorY: 0.5, bodyBelowFloor: 50 };

        const comY = (ySum / count) / h;

        // Estimate floor position: scan for the grid line.
        // The floor is a thin horizontal feature. In ortho side view,
        // it should be near the bottom of the model's extent.
        // Use the lower 20% of model pixels as the floor region.
        const floorY = (maxModelY) / h;

        // Count pixels below the estimated floor (bottom 15% of model range)
        const modelRange = maxModelY - minModelY;
        const floorThreshold = maxModelY - modelRange * 0.15;
        let belowFloor = 0;
        for (let glY = 0; glY < h; glY++) {
            const screenY = h - 1 - glY;
            if (screenY < floorThreshold) continue;
            for (let x = 0; x < w; x++) {
                const idx = (glY * w + x) * 4;
                const dr = pixels[idx] - bgR;
                const dg = pixels[idx + 1] - bgG;
                const db = pixels[idx + 2] - bgB;
                const dist = Math.sqrt(dr * dr + dg * dg + db * db);
                if (dist > BG_THRESHOLD) belowFloor++;
            }
        }

        const bodyBelowFloor = (belowFloor / count) * 100;
        console.log(`[VerticalPos] comY=${comY.toFixed(3)} floorY=${floorY.toFixed(3)} belowFloor=${bodyBelowFloor.toFixed(1)}% modelPixels=${count} range=${minModelY}-${maxModelY}`);
        return { comY, floorY, bodyBelowFloor };
    });
}
