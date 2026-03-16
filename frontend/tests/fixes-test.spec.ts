import { test, expect } from '@playwright/test';

test('G1 shaders + switch back to SOMA', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => { errors.push(err.message); });
    const logs: string[] = [];
    page.on('console', msg => { logs.push(msg.text()); });

    await page.goto('http://localhost:8666/');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Screenshot SOMA initial
    await page.screenshot({ path: 'tests/screenshots/fix_soma_initial.png', fullPage: true });

    // Switch to G1
    await page.locator('#model-selector button[data-model="g1"]').click();
    await page.waitForTimeout(12000);

    // G1 should have anim loaded and playing
    await page.screenshot({ path: 'tests/screenshots/fix_g1_with_anim.png', fullPage: true });

    // Switch back to SOMA
    await page.locator('#model-selector button[data-model="soma"]').click();
    await page.waitForTimeout(8000);

    // SOMA should be correct scale/rotation
    await page.screenshot({ path: 'tests/screenshots/fix_soma_after_switch.png', fullPage: true });

    // Print errors and relevant logs
    console.log('=== ERRORS ===');
    for (const e of errors) console.log(e);
    console.log('=== G1 LOGS ===');
    for (const l of logs) {
        if (l.includes('[G1') || l.includes('Failed') || l.includes('Material')) console.log(l);
    }

    expect(errors).toEqual([]);
});
