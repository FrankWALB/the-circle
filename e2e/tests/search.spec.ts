import { test, expect } from '@playwright/test';
import { clearDatabase, quickAdd, resolveAsNew } from './helpers';

test.describe('Suche', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();

    // Seed some persons
    for (const name of ['Klaus Meyer', 'Petra Schmidt', 'Hans Weber']) {
      await quickAdd(page, name);
      await resolveAsNew(page, name);
      await page.goto('/');
      await page.waitForSelector('[data-testid="quick-add-input"]');
    }
  });

  test('Instant-Suche filtert Personen clientseitig', async ({ page }) => {
    const input = page.getByTestId('quick-add-input');

    // Go offline to confirm it's client-side
    await page.context().setOffline(true);

    await input.fill('Klaus');
    await expect(page.getByTestId('persons-list')).toBeVisible();
    const cards = page.getByTestId('person-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Klaus Meyer');

    await page.context().setOffline(false);
  });

  test('Person öffnen über Suchergebnis', async ({ page }) => {
    const input = page.getByTestId('quick-add-input');
    await input.fill('Petra');

    const cards = page.getByTestId('person-card');
    await cards.first().click();

    await expect(page).toHaveURL(/\/persons\/.+/);
    await expect(page.locator('.header-name')).toContainText('Petra Schmidt');
  });

  test('Leere Suche zeigt alle Personen', async ({ page }) => {
    const cards = page.getByTestId('person-card');
    await expect(cards).toHaveCount(3);
  });
});
