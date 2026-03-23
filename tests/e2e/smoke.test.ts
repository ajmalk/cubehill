import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  // Phase 4: home page shows T Perm demo — h1 is the algorithm name
  await expect(page.locator('h1')).toContainText('T Perm');
});

test('home page has navbar', async ({ page }) => {
  await page.goto('/');
  // CubeHill branding lives in the navbar link, not h1
  await expect(page.locator('.navbar')).toContainText('CubeHill');
});

test('home page has cube viewer canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
});
