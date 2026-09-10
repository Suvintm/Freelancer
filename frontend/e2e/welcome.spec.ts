import { test, expect } from '@playwright/test';

test.describe('Welcome Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 🛰️ MOCK NEXUS HEALTH CHECK
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'operational' }),
      });
    });

    // Prevent redirect to /maintenance by mocking the auth check
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: null }),
      });
    });
  });

  test('should load the welcome page and display the logo and hero headline', async ({ page }) => {
    await page.goto('/');
    
    // Check for logo in header
    const logo = page.locator('header img');
    await expect(logo).toBeVisible();
    
    // Check for main hero title
    await expect(page.getByRole('heading', { name: /Turn Your/i }).first()).toBeVisible();
  });

  test('should display call-to-action buttons and initial slide', async ({ page }) => {
    await page.goto('/');
    
    // Check for "Get started for free" button
    const getStarted = page.getByRole('link', { name: /Get started for free/i }).first();
    await expect(getStarted).toBeVisible();
    await expect(getStarted).toHaveAttribute('href', '/signup');

    // Check for "Create your account" button in presentation card
    const createAccount = page.getByRole('link', { name: /Create your account/i }).first();
    await expect(createAccount).toBeVisible();
    await expect(createAccount).toHaveAttribute('href', '/signup');

    // Check for initial presentation slide title
    await expect(page.getByRole('heading', { name: /Scale Your/i }).first()).toBeVisible();
  });

  test('should auto-advance presentation slides', async ({ page }) => {
    await page.goto('/');
    
    // Initial slide
    await expect(page.getByRole('heading', { name: /Scale Your/i }).first()).toBeVisible();
    
    // Auto-advances to next slide
    await expect(page.getByRole('heading', { name: /Promote with/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
