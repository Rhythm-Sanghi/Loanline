import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Loanline E2E Verification & Judge Route', () => {
  test('executes complete desktop judge workflow, verifies allocator reveal, and captures screenshots', async ({ page }, testInfo) => {
    // Only run full screenshot flow on desktop project
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // 1. Visit application
    await page.goto('/');

    // 2. Verify Header & Workspace status
    await expect(page.locator('.brand-title')).toHaveText('LOANLINE');
    await expect(page.locator('.brand-badge')).toHaveText(/Sample workspace/i);

    // 3. Verify Policy Comparison cards and counts
    const baselineCard = page.locator('.policy-card', { hasText: 'Queue order · first compatible laptop' });
    const recommendedCard = page.locator('.policy-card', { hasText: 'Serve most requests' });

    await expect(baselineCard).toContainText('2 of 4');
    await expect(recommendedCard).toContainText('3 of 4');
    await expect(recommendedCard).toHaveClass(/active/);
    await expect(recommendedCard).toContainText('+1 more on same stock');

    // 4. Verify Allocation Table assignments
    // Q-01: Assigned to LT-02 (Reassigned)
    const q1Row = page.locator('tr', { hasText: 'Q-01' });
    await expect(q1Row).toContainText('LT-02');
    await expect(q1Row).toContainText('Reassigned (LT-01)');

    // Q-02: Assigned to LT-01 (Newly served)
    const q2Row = page.locator('tr', { hasText: 'Q-02' });
    await expect(q2Row).toContainText('LT-01');
    await expect(q2Row).toContainText('Newly served');

    // Q-03: Assigned to LT-03
    const q3Row = page.locator('tr', { hasText: 'Q-03' });
    await expect(q3Row).toContainText('LT-03');

    // Q-04: Waiting
    const q4Row = page.locator('tr', { hasText: 'Q-04' });
    await expect(q4Row).toContainText('Waiting');

    // 5. Verify Inspector for default selection (Q-02) - immediately visible on first screen
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toContainText('Q-02');
    await expect(inspector).toContainText('Assigned under recommended policy');
    await expect(inspector).toContainText('The Reveal: The oldest request (Q-01) can use either laptop');
    await expect(inspector).toContainText('one more compatible proposal on the same fictional stock');
    await expect(page.locator('.panel-subtitle')).toContainText('Selected: Q-02');

    // Capture screenshot: recommendation with Q-02 selected
    const q02ScreenshotPath = path.resolve(process.cwd(), 'docs/screenshots/q02-selected.png');
    await page.screenshot({ path: q02ScreenshotPath, fullPage: true });

    // 6. Select Q-04 and verify structured incompatibility explanation
    await q4Row.click();
    await expect(inspector).toContainText('Q-04');
    await expect(inspector).toContainText('No compatible laptop');
    await expect(inspector).toContainText('battery');

    // 7. Trigger "What if? Preview LT-04"
    const previewBtn = page.getByRole('button', { name: /What if\? Preview LT-04/i });
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Verify preview banner
    const previewBanner = page.locator('.banner-preview');
    await expect(previewBanner).toBeVisible();
    await expect(previewBanner).toContainText('PREVIEW ONLY');
    await expect(previewBanner).toContainText('Simulating LT-04 (Repair → Ready) under Recommended Policy ("Serve most requests")');
    await expect(previewBanner).toContainText('Conditional gain if repaired:');
    await expect(previewBanner).toContainText('3 proposed → 4 proposed');
    await expect(previewBanner).toContainText('(+1 conditional proposal)');
    await expect(previewBanner).toContainText('Newly served: Q-04');

    // Verify print media behavior:
    // Preview banner is hidden (no-print) while print header is visible reflecting current 3-of-4 plan
    await page.emulateMedia({ media: 'print' });
    await expect(previewBanner).not.toBeVisible();
    const printHeader = page.locator('.print-header');
    await expect(printHeader).toBeVisible();
    await expect(printHeader).toContainText('3 of 4 requests served');
    await expect(printHeader).toContainText('Exploratory repair simulations are excluded');
    await expect(page.locator('.data-table tbody tr', { hasText: 'Q-01' })).toContainText('LT-02');
    await expect(page.locator('.data-table tbody tr', { hasText: 'Q-02' })).toContainText('LT-01');
    await expect(page.locator('.data-table tbody tr', { hasText: 'Q-03' })).toContainText('LT-03');
    await expect(page.locator('.data-table tbody tr', { hasText: 'Q-04' })).toContainText('Waiting');
    await page.emulateMedia({ media: 'screen' });
    await expect(previewBanner).toBeVisible();

    // Capture screenshot: LT-04 repair preview
    const previewScreenshotPath = path.resolve(process.cwd(), 'docs/screenshots/repair-preview.png');
    await page.screenshot({ path: previewScreenshotPath, fullPage: true });

    // Close preview
    const closePreviewBtn = page.getByRole('button', { name: /Close.*preview/i });
    await closePreviewBtn.click();
    await expect(previewBanner).not.toBeVisible();

    // Verify view returns to 3 of 4
    await expect(page.locator('.policy-card', { hasText: 'Serve most requests' })).toContainText('3 of 4');
    await expect(page.locator('.badge-mono', { hasText: 'Proposed' })).toContainText('3 / 4 Proposed');

    // 8. Tab Navigation: Requests & Inventory
    const requestsTab = page.locator('.nav-tab', { hasText: 'Requests' });
    await requestsTab.click();
    await expect(page.locator('.panel-title')).toContainText('Fictional Loan Requests');
    await expect(page.locator('tbody tr')).toHaveCount(4);

    const inventoryTab = page.locator('.nav-tab', { hasText: 'Inventory' });
    await inventoryTab.click();
    await expect(page.locator('.panel-title')).toContainText('Refurbished Laptop Inventory');
    await expect(page.locator('tbody tr')).toHaveCount(4);

    // Switch back to Plan
    const planTab = page.locator('.nav-tab', { hasText: 'Plan & Allocation' });
    await planTab.click();

    // 9. Keyboard traversal test
    await q1Row.click();
    await expect(inspector).toContainText('Q-01');
    await page.keyboard.press('ArrowDown');
    await expect(inspector).toContainText('Q-02');
    await page.keyboard.press('ArrowDown');
    await expect(inspector).toContainText('Q-03');

    // 10. Switch policy to baseline and verify UI updates
    await baselineCard.click();
    await expect(baselineCard).toHaveClass(/active/);
    await expect(page.locator('.badge-mono', { hasText: 'Proposed' })).toContainText('2 / 4 Proposed');

    // In baseline, trigger repair preview on Q-04 to verify contextual note and print isolation
    await q4Row.click();
    await previewBtn.click();
    await expect(previewBanner).toBeVisible();
    await expect(previewBanner).toContainText('Active plan view: Baseline heuristic');
    await expect(previewBanner).toContainText('Preview reflects recommended matching with repair applied.');

    // Verify print media reflects the active baseline plan (2 of 4) while preview is active
    await page.emulateMedia({ media: 'print' });
    await expect(previewBanner).not.toBeVisible();
    await expect(printHeader).toContainText('2 of 4 requests served');
    await page.emulateMedia({ media: 'screen' });

    // Close preview and switch back to recommended
    await closePreviewBtn.click();
    await expect(previewBanner).not.toBeVisible();
    await recommendedCard.click();

    // Ensure zero uncaught errors
    expect(consoleErrors).toEqual([]);
  });

  test('verifies that The Reveal callout disappears dynamically when Q-02 RAM or LT-01 status is edited', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop only');

    await page.goto('/');

    // 1. Initial golden state: The Reveal is visible for Q-02
    await expect(page.locator('.reveal-callout')).toBeVisible();
    await expect(page.locator('.reveal-callout')).toContainText('The Reveal:');

    // 2. Edit LT-01 to 'Repair' status in Inventory tab
    await page.locator('.nav-tab', { hasText: 'Inventory' }).click();
    const lt01Row = page.locator('tr', { hasText: 'LT-01' });
    await lt01Row.getByRole('button', { name: 'Edit' }).click();

    // Change status from Ready to Repair
    await page.locator('#lap-status').selectOption('Repair');
    await page.getByRole('button', { name: 'Save edits' }).click();

    // 3. Switch back to Plan tab
    await page.locator('.nav-tab', { hasText: 'Plan & Allocation' }).click();

    // In this modified state, LT-01 is in Repair so Q-02 cannot receive it.
    // Verify that the stale "The Reveal" callout has completely disappeared!
    await expect(page.locator('.reveal-callout')).not.toBeVisible();

    // Q-02 inspector now shows waiting reason instead of stale claims
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toContainText('Q-02');
    await expect(inspector).toContainText('No compatible laptop');

    // 4. Reset back to sample workspace via modal
    await page.getByRole('button', { name: /Reset sample/i }).click();
    await page.getByRole('button', { name: 'Reset workspace' }).click();

    // 5. Verify The Reveal callout reappears on restored sample
    await expect(page.locator('.reveal-callout')).toBeVisible();

    // 6. Now edit Q-02's RAM requirement to 8 GB in Requests tab
    await page.locator('.nav-tab', { hasText: 'Requests' }).click();
    const q02Row = page.locator('tr', { hasText: 'Q-02' });
    await q02Row.getByRole('button', { name: 'Edit' }).click();

    // Change min RAM to 8 GB
    await page.locator('#req-ram').selectOption('8');
    await page.getByRole('button', { name: 'Save edits' }).click();

    // 7. Switch back to Plan tab
    await page.locator('.nav-tab', { hasText: 'Plan & Allocation' }).click();

    // Verify that The Reveal callout (which claims Q-02 needs 16 GB) is NOT displayed
    await expect(page.locator('.reveal-callout')).not.toBeVisible();
  });

  test('verifies mobile responsive layout and inspector readability at 390px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile only');

    await page.goto('/');

    // Check title and metrics
    await expect(page.locator('.brand-title')).toBeVisible();
    const recommendedCard = page.locator('.policy-card', { hasText: 'Serve most requests' });
    await expect(recommendedCard).toContainText('3 of 4');

    // Verify inspector is stacked and readable
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText('Q-02');

    // Capture mobile screenshot
    const mobileScreenshotPath = path.resolve(process.cwd(), 'docs/screenshots/mobile-inspector.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
  });
});
