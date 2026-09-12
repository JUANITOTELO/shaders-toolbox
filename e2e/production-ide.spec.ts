import { test, expect } from '@playwright/test';

test.describe('ShaderStudio IDE Production Suite', () => {
  test('loads IDE shell, navigation, and compiles default shader', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Graphics & Shader Math Toolbox/);
    await expect(page.getByText('ShaderStudio IDE', { exact: true })).toBeVisible();

    // Verify canvas renders
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify compilation status is OK
    await expect(page.getByText('Compiled OK')).toBeVisible();
  });

  test('switches between math tools across multiple chapters', async ({ page }) => {
    await page.goto('/');

    // Switch to Hexagonal Grid Tiling
    await page.click('text=Hexagonal Grid Tiling');
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('Hexagonal Grid Tiling');

    // Switch to Blinn-Phong & Schlick-Fresnel Illuminator
    await page.click('text=Blinn-Phong & Schlick-Fresnel Illuminator');
    await expect(input).toHaveValue('Blinn-Phong & Schlick-Fresnel Illuminator');
  });

  test('handles live GLSL compilation errors with line diagnostics', async ({ page }) => {
    await page.goto('/');

    // Type invalid GLSL into the CodeMirror editor
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('invalid_glsl_syntax();');

    // Verify error diagnostics banner appears
    await expect(page.getByText('Error', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('toggles sidebar collapse to icon bar and expands back', async ({ page }) => {
    await page.goto('/');

    // Click collapse button
    const collapseBtn = page.locator('button[title="Collapse Sidebar"]');
    await collapseBtn.click();

    // Verify expand button is visible
    const expandBtn = page.locator('button[title="Expand Sidebar"]');
    await expect(expandBtn).toBeVisible();

    // Click expand button
    await expandBtn.click();
    await expect(page.getByRole('button', { name: 'Zero to Hero' })).toBeVisible();
  });

  test('manages folder categories in the sidebar', async ({ page }) => {
    await page.goto('/');

    // Switch to Folders tab
    await page.click('text=Folders');
    await expect(page.locator('text=Library Folders')).toBeVisible();
    await expect(page.locator('text=All Custom Presets')).toBeVisible();
  });
});
