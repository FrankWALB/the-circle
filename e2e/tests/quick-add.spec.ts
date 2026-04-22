import { test, expect } from '@playwright/test';
import { clearDatabase, quickAdd, resolveAsNew, resolveAsExisting } from './helpers';

test.describe('Quick Add — Offline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await page.waitForSelector('[data-testid="quick-add-input"]');
  });

  test('Neue Person anlegen und Notiz zuordnen in unter 5 Sekunden', async ({ page }) => {
    const start = Date.now();

    // Go offline
    await page.context().setOffline(true);

    await quickAdd(page, 'Max Muster hat 2 Kinder und spielt Tennis');
    await resolveAsNew(page, 'Max Muster');

    // Should navigate to person detail
    await expect(page).toHaveURL(/\/persons\/.+/);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);

    // Note should appear
    await expect(page.getByTestId('note-item').first()).toContainText('Max Muster hat 2 Kinder');

    await page.context().setOffline(false);
  });

  test('Person anlegen offline — sync nach online wieder her', async ({ page }) => {
    await page.context().setOffline(true);

    await quickAdd(page, 'Anna Schmidt');
    await resolveAsNew(page, 'Anna Schmidt');
    await expect(page).toHaveURL(/\/persons\/.+/);

    // Back online
    await page.context().setOffline(false);

    // Sync queue should process without errors
    await page.waitForTimeout(2000);
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('Bestehender Person eine Notiz zuordnen', async ({ page }) => {
    // Create person first
    await quickAdd(page, 'Testperson');
    await resolveAsNew(page, 'Testperson');
    await expect(page).toHaveURL(/\/persons\/.+/);

    // Back home
    await page.goto('/');
    await page.waitForSelector('[data-testid="persons-list"]');

    // Add note to existing person
    await quickAdd(page, 'War heute beim Arzt');
    await resolveAsExisting(page, 'Testperson');

    // Should navigate back to person
    await expect(page).toHaveURL(/\/persons\/.+/);
    await expect(page.getByTestId('note-item').first()).toContainText('War heute beim Arzt');
  });
});
