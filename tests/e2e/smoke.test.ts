import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  // Phase 5: home page is the landing page — shows OLL and PLL nav cards
  await expect(page.locator('h2').first()).toBeVisible();
  await expect(page.locator('a[href*="/oll/"]')).toBeVisible();
  await expect(page.locator('a[href*="/pll/"]')).toBeVisible();
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
