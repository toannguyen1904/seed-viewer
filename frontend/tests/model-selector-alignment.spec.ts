import { test, expect } from '@playwright/test';

test('All right-bar icons are vertically aligned on same right edge', async ({ page }) => {
    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // All elements that should share the same right edge
    const settingsBtn = page.locator('#settings-cog-btn');
    const viewCube = page.locator('#vc-scene');
    const modelBtns = page.locator('#model-selector button[data-model]');

    await expect(settingsBtn).toBeVisible();
    await expect(viewCube).toBeVisible();

    const settingsBox = await settingsBtn.boundingBox();
    const viewCubeBox = await viewCube.boundingBox();
    const modelBtnCount = await modelBtns.count();

    expect(settingsBox).not.toBeNull();
    expect(viewCubeBox).not.toBeNull();
    expect(modelBtnCount).toBeGreaterThanOrEqual(2);

    const settingsRight = settingsBox!.x + settingsBox!.width;
    const viewCubeRight = viewCubeBox!.x + viewCubeBox!.width;

    // Model icon buttons: check each one's right edge
    const modelRights: number[] = [];
    for (let i = 0; i < modelBtnCount; i++) {
        const box = await modelBtns.nth(i).boundingBox();
        expect(box).not.toBeNull();
        modelRights.push(box!.x + box!.width);
    }

    // All right edges should align within 2px of the rightmost model button
    const referenceRight = modelRights[0];

    // Model buttons align with each other
    for (let i = 1; i < modelRights.length; i++) {
        expect(Math.abs(modelRights[i] - referenceRight)).toBeLessThan(2);
    }

    // View cube right edge aligns with model buttons (view cube is wider, so use its right)
    expect(Math.abs(viewCubeRight - referenceRight)).toBeLessThan(2);

    // Settings button right edge aligns with model buttons
    expect(Math.abs(settingsRight - referenceRight)).toBeLessThan(2);

    // Model icons are stacked vertically
    if (modelBtnCount >= 2) {
        const btn0 = await modelBtns.nth(0).boundingBox();
        const btn1 = await modelBtns.nth(1).boundingBox();
        expect(btn1!.y).toBeGreaterThan(btn0!.y);
        // Left edges aligned
        expect(Math.abs(btn0!.x - btn1!.x)).toBeLessThan(2);
    }

    await page.screenshot({ path: 'tests/screenshots/model-selector-alignment.png', fullPage: true });
});
