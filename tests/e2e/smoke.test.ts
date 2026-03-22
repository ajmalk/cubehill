import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('CubeHill');
});

test('home page has description', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('p')).toContainText('Speedcubing algorithm visualizer');
});
