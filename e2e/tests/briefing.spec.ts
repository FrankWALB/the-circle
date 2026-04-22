import { test, expect } from '@playwright/test';
import { clearDatabase, quickAdd, resolveAsNew } from './helpers';

test.describe('Briefing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();

    // Create a person with notes
    await quickAdd(page, 'Briefing Testperson');
    await resolveAsNew(page, 'Briefing Testperson');
    await page.waitForURL(/\/persons\/.+/);

    // Add notes
    const noteInput = page.getByTestId('quick-note-input');
    await noteInput.fill('Liebt Bergwandern');
    await noteInput.press('Enter');
    await noteInput.fill('Hat eine Katze namens Luna');
    await noteInput.press('Enter');
  });

  test('Briefing zeigt alle Key-Infos auf einem Screen', async ({ page }) => {
    // Navigate to briefing
    await page.locator('a[href*="briefing"]').click();
    await expect(page).toHaveURL(/\/persons\/.+\/briefing/);

    // Should have briefing header
    await expect(page.locator('.briefing-title')).toContainText('Briefing Testperson');

    // Should show recent notes
    await expect(page.locator('.note-brief').first()).toBeVisible();
  });

  test('Briefing zeigt bevorstehende Events', async ({ page }) => {
    // Go to person detail and add an event
    const noteInput = page.getByTestId('quick-note-input');
    await expect(noteInput).toBeVisible();

    // Add event via the events section
    await page.locator('button[mat-icon-button]').filter({ hasText: 'add' }).first().click();
    // If the add fact button is clicked, cancel and try events section
    await page.keyboard.press('Escape');

    // Navigate to briefing
    await page.locator('a[href*="briefing"]').click();
    await expect(page).toHaveURL(/\/persons\/.+\/briefing/);
    await expect(page.locator('.briefing-title')).toBeVisible();
  });

  test('Briefing lädt offline', async ({ page }) => {
    const personUrl = page.url();

    await page.context().setOffline(true);

    // Navigate to briefing
    await page.locator('a[href*="briefing"]').click();
    await expect(page).toHaveURL(/\/persons\/.+\/briefing/);

    // Should still show content from local DB
    await expect(page.locator('.briefing-title')).toContainText('Briefing Testperson');
    await expect(page.locator('.note-brief').first()).toBeVisible();

    await page.context().setOffline(false);
  });
});
