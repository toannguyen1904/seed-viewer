import { test, expect } from '@playwright/test';

test('ViewCube in upperbar + G1 skeleton fix', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => { errors.push(err.message); });

    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 1. Verify download button is hidden
    const download = page.locator('#download-anim');
    await expect(download).toBeHidden();

    // 2. Verify view cube and projection toggle are in upperbar
    const upperbar = page.locator('#upperbar');
    const vcScene = upperbar.locator('#vc-scene');
    await expect(vcScene).toBeVisible();
    const projBtn = upperbar.locator('#proj-toggle-btn');
    await expect(projBtn).toBeVisible();

    // Screenshot SOMA model with new layout
    await page.screenshot({ path: 'tests/screenshots/layout_soma.png', fullPage: true });

    // 3. Switch to G1 and test skeleton
    await page.locator('#model-selector button[data-model="g1"]').click();
    await page.waitForTimeout(12000);

    // Click an animation
    const dataRows = page.locator('#browser-table tbody tr[name="datarow"]');
    const count = await dataRows.count();
    for (let i = 0; i < count; i++) {
        const text = await dataRows.nth(i).textContent();
        if (text?.includes('squat_001')) {
            await dataRows.nth(i).click({ force: true });
            break;
        }
    }
    await page.waitForTimeout(3000);

    // Show skeleton
    const skelBtn = page.locator('#skeletonButton');
    if (await skelBtn.count() > 0) {
        await skelBtn.click({ force: true });
        await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'tests/screenshots/g1_skeleton_fixed.png', fullPage: true });

    // No errors
    expect(errors).toEqual([]);
});
