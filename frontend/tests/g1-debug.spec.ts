import { test, expect } from '@playwright/test';

test('G1 debug: squat root position frame 0 vs 150', async ({ page }) => {
    const debugMessages: string[] = [];
    page.on('console', msg => { debugMessages.push(msg.text()); });
    const errors: string[] = [];
    page.on('pageerror', err => { errors.push(err.message); });

    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Switch to G1
    await page.locator('#model-select-dropdown').selectOption('g1');
    await page.waitForTimeout(12000);

    // Find and click squat animation
    const dataRows = page.locator('#browser-table tbody tr[name="datarow"]');
    const count = await dataRows.count();
    let found = false;
    for (let i = 0; i < count; i++) {
        const text = await dataRows.nth(i).textContent();
        if (text?.includes('squat_001')) {
            await dataRows.nth(i).click({ force: true });
            found = true;
            break;
        }
    }
    console.log('Found squat animation:', found);
    await page.waitForTimeout(3000);

    // Screenshot frame 0
    await page.screenshot({ path: 'tests/screenshots/squat_frame0.png', fullPage: true });

    // Advance to frame 150 using the timeline input
    // Try setting frame via the timeline range input
    const timelineInput = page.locator('#timelineRange');
    if (await timelineInput.count() > 0) {
        await timelineInput.fill('150');
        await timelineInput.dispatchEvent('input');
        await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'tests/screenshots/squat_frame150.png', fullPage: true });

    // Print debug
    console.log('\n=== G1 DEBUG ===');
    for (const m of debugMessages) {
        if (m.includes('[G1')) console.log(m);
    }
    console.log('\n=== ERRORS ===');
    for (const e of errors) console.log(e);
});
