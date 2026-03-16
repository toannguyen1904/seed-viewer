import { test, expect } from '@playwright/test';

test('ViewCube and projection toggle are visible and functional', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => { errors.push(err.message); });

    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Verify view cube scene container exists and has 6 face divs
    const vcScene = page.locator('#vc-scene');
    await expect(vcScene).toBeVisible();
    const faces = page.locator('#vc-cube > div');
    expect(await faces.count()).toBe(6);

    // Verify projection toggle button exists
    const projBtn = page.locator('#proj-toggle-btn');
    await expect(projBtn).toBeVisible();

    // Screenshot initial state
    await page.screenshot({ path: 'tests/screenshots/viewcube_initial.png', fullPage: true });

    // Click "Front" face (force: true to bypass CSS 3D pointer interception)
    await faces.filter({ hasText: 'Front' }).click({ force: true });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/viewcube_front.png', fullPage: true });

    // Click "Right" face
    await faces.filter({ hasText: 'Right' }).click({ force: true });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/viewcube_right.png', fullPage: true });

    // Click "Top" face
    await faces.filter({ hasText: 'Top' }).click({ force: true });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/viewcube_top.png', fullPage: true });

    // Toggle to orthographic
    await projBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/viewcube_ortho.png', fullPage: true });

    // Toggle back to perspective
    await projBtn.click();
    await page.waitForTimeout(200);

    // No errors should have occurred
    expect(errors).toEqual([]);
});
