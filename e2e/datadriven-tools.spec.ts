import { test, expect } from '@playwright/test';

test.describe('Data-Driven Tools CRUD & Dynamic Architecture', () => {
  test('loads tools from database and displays curriculum count', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Graphics & Shader Math Toolbox/);

    // Verify dynamic tool count is visible
    const completionText = page.locator('text=/\\d+ \\/ \\d+ Completed/');
    await expect(completionText).toBeVisible();

    // Verify default seeded tool card is loaded in sidebar
    await expect(page.getByRole('heading', { name: 'The SIMD Parallel Mental Model' })).toBeVisible();
  });

  test('creates a new custom shader tool dynamically and renders it', async ({ page }) => {
    await page.goto('/');

    // Click "+ New Tool" button
    const newToolBtn = page.getByRole('button', { name: /New Tool/i });
    await expect(newToolBtn).toBeVisible();
    await newToolBtn.click();

    // Fill in ToolModal form
    const toolName = `Dynamic Neon Warp ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Polar Vortex Warp"]', toolName);
    await page.fill('textarea[placeholder^="Brief summary"]', 'E2E automated dynamic tool verification test');

    // Submit form
    await page.click('button:has-text("Create Tool")');

    // Verify tool appears in curriculum list
    await expect(page.getByRole('heading', { name: toolName })).toBeVisible({ timeout: 5000 });

    // Verify tool is selected and active in header
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toHaveValue(toolName);

    // Verify canvas renders with OK status
    await expect(page.getByText('Compiled OK')).toBeVisible();
  });

  test('edits tool code and documentation and persists updates', async ({ page }) => {
    await page.goto('/');

    // Select the first tool
    await page.getByRole('heading', { name: 'The SIMD Parallel Mental Model' }).click();

    // Edit tool metadata modal opens and closes
    const toolInfoBtn = page.getByRole('button', { name: /Tool Info/i });
    if (await toolInfoBtn.isVisible()) {
      await toolInfoBtn.click();
      await expect(page.getByText('Edit Tool:')).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }

    // Edit code in CodeMirror editor
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type('\n// verified dynamic tool edit');

    // Click Save
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/Saved.*DB|Updated/i)).toBeVisible({ timeout: 5000 });
  });

  test('deletes a dynamically created tool', async ({ page }) => {
    await page.goto('/');

    // Create a temporary tool to delete
    const newToolBtn = page.getByRole('button', { name: /New Tool/i });
    await newToolBtn.click();
    const tempName = `Delete Target ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Polar Vortex Warp"]', tempName);
    await page.click('button:has-text("Create Tool")');

    // Verify tool was created in sidebar
    const toolHeading = page.getByRole('heading', { name: tempName });
    await expect(toolHeading).toBeVisible({ timeout: 5000 });

    // Locate the tool card and delete it
    const toolCard = page.locator('.group', { has: toolHeading });
    await expect(toolCard).toBeVisible();
    await toolCard.hover();

    page.on('dialog', dialog => dialog.accept());
    const deleteBtn = toolCard.locator('button[title="Delete tool"]');
    await deleteBtn.click();

    // Verify tool heading is removed
    await expect(toolHeading).not.toBeVisible({ timeout: 5000 });
  });
});
