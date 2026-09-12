import { test, expect } from '@playwright/test';

test.describe('Academic Math & Code Documentation Suite', () => {
  test('navigates to Math & Docs tab and verifies rendered formula and breakdown', async ({ page }) => {
    await page.goto('/');

    // Click Math & Docs tab in header
    await page.click('text=Math & Docs');

    // Verify academic heading for Lesson #1 is visible
    await expect(page.getByText('The GPU Mental Model & The SIMD Execution Pipeline')).toBeVisible();

    // Verify architectural theory section is rendered
    await expect(page.getByText(/Architectural Theory/)).toBeVisible();

    // Verify GLSL pipeline breakdown section is rendered
    await expect(page.getByText(/GLSL Pipeline Breakdown/)).toBeVisible();
  });

  test('edits markdown documentation and toggles back to rendered view', async ({ page }) => {
    await page.goto('/');

    // Go to docs
    await page.click('text=Math & Docs');

    // Click Edit Markdown button
    await page.click('text=Edit Markdown');

    // Textarea should now be present for editing documentation
    const docTextarea = page.locator('textarea');
    await expect(docTextarea).toBeVisible();
    await docTextarea.fill('# Updated Academic Research Notes\n\nThis is a custom theoretical note.');

    // Toggle back to Rendered View
    await page.click('text=Rendered View');
    await expect(page.getByText('Updated Academic Research Notes')).toBeVisible();
  });

  test('switches to split view mode', async ({ page }) => {
    await page.goto('/');

    // Click Split View tab
    await page.click('text=Split View');

    // Verify both canvas viewport and academic documentation are visible simultaneously
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await expect(page.getByText(/Architectural Theory/)).toBeVisible();
  });
});
