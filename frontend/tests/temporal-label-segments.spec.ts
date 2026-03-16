import { test, expect } from '@playwright/test';

test('temporal label segments render one pill per event', async ({ page }) => {
    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Enable temporal labels
    await page.click('#temporalLabelButton');

    // Load an animation from the browser table (click first row)
    const firstRow = page.locator('#browser-table tbody tr').first();
    await firstRow.waitFor({ timeout: 10000 });
    await firstRow.click();
    await page.waitForTimeout(5000);

    // The temporalLabelSegments container should be visible
    const container = page.locator('#temporalLabelSegments');
    await expect(container).toBeVisible({ timeout: 10000 });

    // Count the pill segments inside
    const segments = container.locator('div');
    const count = await segments.count();
    console.log(`Temporal label segments rendered: ${count}`);

    // There should be more than 1 segment (the bug was everything merging into 1)
    expect(count).toBeGreaterThan(1);

    // Each segment should have a border-radius (pill shape)
    for (let i = 0; i < count; i++) {
        const radius = await segments.nth(i).evaluate(el => getComputedStyle(el).borderRadius);
        expect(radius).not.toBe('0px');
    }

    // Segments should have distinct left positions (not all stacked at 0)
    const lefts = new Set<string>();
    for (let i = 0; i < count; i++) {
        const left = await segments.nth(i).evaluate(el => (el as HTMLElement).style.left);
        lefts.add(left);
    }
    expect(lefts.size).toBe(count);

    await page.screenshot({ path: 'tests/screenshots/temporal_label_segments.png', fullPage: true });
});
