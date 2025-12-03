import { test, expect } from '@playwright/test';

test('should navigate to the welcome page', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toContainText('Social Media Transcription');
  await page.click('text=New');
  await expect(page.locator('h2')).toContainText('Welcome');
});
