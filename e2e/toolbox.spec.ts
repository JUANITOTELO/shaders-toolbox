import { test, expect } from '@playwright/test';

test('toolbox loads and allows selecting a tool', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Graphics & Shader Math Toolbox/);
  
  // Click on Circle SDF
  await page.click('text=Circle SDF');
  
  // Verify preset name input updates
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('Circle SDF');
});
