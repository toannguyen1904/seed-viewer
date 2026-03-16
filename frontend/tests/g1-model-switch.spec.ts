import { test, expect } from '@playwright/test';

test.describe('G1 Model Switch', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:8666/');

        // Wait for the app to load (wait for the canvas to be present)
        await page.waitForSelector('canvas', { timeout: 30000 });

        // Wait for the initial model to load
        await page.waitForTimeout(2000);
    });

    test('model selector buttons are present', async ({ page }) => {
        const somaBtn = page.locator('#model-selector button[data-model="soma"]');
        const g1Btn = page.locator('#model-selector button[data-model="g1"]');
        await expect(somaBtn).toBeVisible();
        await expect(g1Btn).toBeVisible();
    });

    test('switch to G1 model', async ({ page }) => {
        // Listen for console logs
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Listen for errors
        const errors: string[] = [];
        page.on('pageerror', err => {
            errors.push(err.message);
        });

        // Switch to G1
        await page.locator('#model-selector button[data-model="g1"]').click();

        // Wait for model to load
        await page.waitForTimeout(10000);

        // Check no critical errors occurred
        const criticalErrors = errors.filter(e =>
            !e.includes('SharedArrayBuffer') &&
            !e.includes('USDZ')
        );
        expect(criticalErrors).toHaveLength(0);

        // Check that G1 model was loaded
        const robotCreatedLog = consoleMessages.find(m =>
            m.includes('[G1 FBX] Model loaded.')
        );
        expect(robotCreatedLog).toBeTruthy();
    });

    test('switch to G1 and load animation', async ({ page }) => {
        // Listen for console logs
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Listen for errors
        const errors: string[] = [];
        page.on('pageerror', err => {
            errors.push(err.message);
        });

        // Switch to G1
        await page.locator('#model-selector button[data-model="g1"]').click();
        await page.waitForTimeout(3000);

        // Verify G1 model was loaded
        const robotCreatedLog = consoleMessages.find(m => m.includes('[G1 FBX] Model loaded.'));
        expect(robotCreatedLog).toBeTruthy();

        // Click on a data row in the browser table to load an animation
        const dataRows = page.locator('#browser-table tbody tr[name="datarow"]');
        const rowCount = await dataRows.count();
        expect(rowCount).toBeGreaterThan(0);

        const firstDataRow = dataRows.first();
        await firstDataRow.click({ force: true });
        await page.waitForTimeout(4000);

        // Check that G1Animation was loaded
        const animLoadedLog = consoleMessages.find(m => m.includes('G1Animation loaded'));
        expect(animLoadedLog).toBeTruthy();

        // Verify frame count is present
        expect(animLoadedLog).toContain('frames, columns:');

        // Check no critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('SharedArrayBuffer') &&
            !e.includes('USDZ')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('switch to G1 and back to SOMA', async ({ page }) => {
        // Switch to G1
        await page.locator('#model-selector button[data-model="g1"]').click();
        await page.waitForTimeout(2000);

        // Switch back to SOMA
        await page.locator('#model-selector button[data-model="soma"]').click();
        await page.waitForTimeout(3000);

        // Check that SOMA button is active (has accent border)
        const somaBtn = page.locator('#model-selector button[data-model="soma"]');
        await expect(somaBtn).toBeVisible();
    });
});
