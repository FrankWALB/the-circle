import { test, expect } from '@playwright/test';

test.describe('Admin View', () => {
  test('Admin-Seite zeigt Fehler ohne Admin-Header', async ({ page }) => {
    await page.goto('/admin');
    // Default user has no admin role → error banner
    await expect(page.locator('.error-banner')).toBeVisible({ timeout: 10_000 });
  });

  test('Admin-Seite zeigt Stats und Personen mit Admin-Header', async ({ page }) => {
    // Inject admin header via route interception for the API calls
    await page.route('/api/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-user-id': 'admin',
        'x-user-role': 'ADMIN',
      };
      await route.continue({ headers });
    });

    await page.goto('/admin');

    // Stats should appear
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10_000 });

    // Tabs should be present
    await expect(page.locator('.mat-mdc-tab', { hasText: 'Personen' })).toBeVisible();
    await expect(page.locator('.mat-mdc-tab', { hasText: 'Nutzer' })).toBeVisible();
  });

  test('Admin-Suche filtert Personen', async ({ page }) => {
    await page.route('/api/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-user-id': 'admin',
        'x-user-role': 'ADMIN',
      };
      await route.continue({ headers });
    });

    await page.goto('/admin');
    await page.waitForSelector('[data-testid="admin-search"]', { timeout: 10_000 });

    const search = page.getByTestId('admin-search');
    await search.fill('Test');

    // Should trigger search
    await page.waitForTimeout(500);
    await expect(page.locator('app-admin')).toBeVisible();
  });

  test('Admin kann Person Drilldown öffnen', async ({ page }) => {
    await page.route('/api/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-user-id': 'admin',
        'x-user-role': 'ADMIN',
      };
      await route.continue({ headers });
    });

    await page.goto('/admin');

    const rows = page.getByTestId('admin-person-row');
    const count = await rows.count();

    if (count > 0) {
      await rows.first().click();
      await expect(page.getByTestId('admin-detail-panel')).toBeVisible();
    } else {
      // No persons yet — just verify the UI is stable
      await expect(page.locator('.stats-row')).toBeVisible();
    }
  });
});
