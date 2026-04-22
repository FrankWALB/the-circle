import { Page } from '@playwright/test';

export async function clearDatabase(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('the-circle-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function quickAdd(page: Page, text: string) {
  const input = page.getByTestId('quick-add-input');
  await input.fill(text);
  await input.press('Enter');
}

export async function resolveAsNew(page: Page, name?: string) {
  const modal = page.locator('app-resolve-modal');
  if (name) {
    await modal.locator('input.name-input').fill(name);
  }
  await modal.locator('button', { hasText: 'Anlegen' }).click();
}

export async function resolveAsExisting(page: Page, personName: string) {
  const modal = page.locator('app-resolve-modal');
  await modal.locator('.candidate-item', { hasText: personName }).click();
}
