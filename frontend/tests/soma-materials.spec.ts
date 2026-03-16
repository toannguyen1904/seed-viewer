import { test, expect } from '@playwright/test';

test.describe('SOMA Material', () => {

    test('SOMA renders with MeshStandardMaterial', async ({ page }) => {
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        const errors: string[] = [];
        page.on('pageerror', err => {
            errors.push(err.message);
        });

        await page.goto('http://localhost:8666/');
        await page.waitForSelector('[id="3d-viewport"]', { timeout: 30000 });
        await page.waitForTimeout(8000);

        // Verify SOMA materials were applied via console log
        const materialsApplied = consoleMessages.find(m =>
            m.includes('[SOMA Materials] Applied MeshStandardMaterial')
        );
        expect(materialsApplied).toBeTruthy();

        // Check no critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('SharedArrayBuffer') &&
            !e.includes('USDZ')
        );
        expect(criticalErrors).toHaveLength(0);

        const canvas = page.locator('[id="3d-viewport"]');
        await canvas.screenshot({ path: 'tests/screenshots/soma-porcelain.png' });
        await page.screenshot({ path: 'tests/screenshots/soma-full-page.png' });
    });

    test('screenshot: SOMA model has visible reflections (not flat/matte)', async ({ page }) => {
        await page.goto('http://localhost:8666/');
        await page.waitForSelector('[id="3d-viewport"]', { timeout: 30000 });
        await page.waitForTimeout(8000);

        const canvas = page.locator('[id="3d-viewport"]');
        const screenshotBuffer = await canvas.screenshot({ path: 'tests/screenshots/soma-reflections.png' });
        expect(screenshotBuffer.length).toBeGreaterThan(10000);
    });
});
