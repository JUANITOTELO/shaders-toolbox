import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Data-Driven Tools CRUD & Dynamic Architecture', () => {
  test.afterAll(() => {
    // Safety net: ensure pristine database state even if any test failed midway
    const resetScript = path.resolve(__dirname, '../scripts/reset-db.php');
    try {
      execSync(`php "${resetScript}"`, { stdio: 'pipe' });
    } catch (e) {
      console.error('Failed to reset DB after tests:', e);
    }
  });

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
    const toolHeading = page.getByRole('heading', { name: toolName });
    await expect(toolHeading).toBeVisible({ timeout: 5000 });

    // Verify tool is selected and active in header
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toHaveValue(toolName);

    // Verify canvas renders with OK status
    await expect(page.getByText('Compiled OK')).toBeVisible();

    // Self-cleanup: delete created tool so no modifications are left behind
    const toolCard = page.locator('.group', { has: toolHeading });
    await toolCard.hover();
    page.on('dialog', dialog => dialog.accept());
    const deleteBtn = toolCard.locator('button[title="Delete tool"]');
    await deleteBtn.click();
    await expect(toolHeading).not.toBeVisible({ timeout: 5000 });
  });

  test('edits tool code and documentation and persists updates', async ({ page }) => {
    await page.goto('/');

    // Create a dedicated dynamic tool to edit (leaving seeded curriculum pristine)
    const newToolBtn = page.getByRole('button', { name: /New Tool/i });
    await newToolBtn.click();
    const toolName = `Editable Dynamic Tool ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Polar Vortex Warp"]', toolName);
    await page.click('button:has-text("Create Tool")');

    const toolHeading = page.getByRole('heading', { name: toolName });
    await expect(toolHeading).toBeVisible({ timeout: 5000 });

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

    // Switch to another tool
    await page.getByRole('heading', { name: 'The SIMD Parallel Mental Model' }).click();
    await expect(page.locator('input[type="text"]').first()).toHaveValue('The SIMD Parallel Mental Model');

    // Switch back and verify persisted edits were retrieved cleanly
    await toolHeading.click();
    await expect(page.locator('input[type="text"]').first()).toHaveValue(toolName);
    await expect(editor).toContainText('// verified dynamic tool edit');

    // Verify shader compiles cleanly without function redefinition or duplicate errors
    await expect(page.getByText('Compiled OK')).toBeVisible();

    // Self-cleanup: delete the dynamic tool
    const toolCard = page.locator('.group', { has: toolHeading });
    await toolCard.hover();
    page.on('dialog', dialog => dialog.accept());
    const deleteBtn = toolCard.locator('button[title="Delete tool"]');
    await deleteBtn.click();
    await expect(toolHeading).not.toBeVisible({ timeout: 5000 });
  });

  test('saves shader to folder category and retrieves it in Folders tab and Preset modal', async ({ page }) => {
    await page.goto('/');

    const presetTitle = `Folder Test Preset ${Date.now()}`;
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(presetTitle);

    // Switch to Folders tab in sidebar
    await page.click('button:has-text("Folders")');
    await expect(page.locator('text=Library Folders')).toBeVisible();

    // Click '+' button on Default Collection folder to save current shader into it
    const defaultFolderRow = page.locator('div.group', { hasText: 'Default Collection' });
    await expect(defaultFolderRow).toBeVisible();
    await defaultFolderRow.hover();
    const saveToFolderBtn = defaultFolderRow.locator('button[title="Save current shader to this folder"]');
    await saveToFolderBtn.click();

    // Verify notification appeared and preset is visible inside the expanded folder
    await expect(page.getByText(/Saved to folder!/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(presetTitle).first()).toBeVisible({ timeout: 5000 });

    // Open Presets modal and verify preset is retrieved there
    await page.getByRole('button', { name: /Presets/i }).click();
    await expect(page.getByText('Preset Library & Digital Asset Manager')).toBeVisible();
    const modalHeading = page.getByRole('heading', { name: presetTitle });
    await expect(modalHeading).toBeVisible();

    // Load preset from modal
    const presetCard = page.locator('div', { has: modalHeading });
    await presetCard.getByRole('button', { name: 'Load' }).click();

    // Verify loaded preset is now active in header and compiles OK
    await expect(nameInput).toHaveValue(presetTitle);
    await expect(page.getByText('Compiled OK')).toBeVisible();

    // Self-cleanup: delete the preset from the Presets modal
    await page.getByRole('button', { name: /Presets/i }).click();
    const modal = page.locator('.fixed');
    await expect(modal.getByText('Preset Library & Digital Asset Manager')).toBeVisible();
    const modalCard = modal.locator('div.rounded-xl', { has: page.getByRole('heading', { name: presetTitle }) });
    page.on('dialog', dialog => dialog.accept());
    await modalCard.locator('button:has(.lucide-trash-2)').click();
    await expect(modal.getByRole('heading', { name: presetTitle })).not.toBeVisible({ timeout: 5000 });
    await modal.locator('button:has(.lucide-x)').click();
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
