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

  test('should load the welcome page and display the logo', async ({ page }) => {
    await page.goto('/');
    
    // Check for logo
    const logo = page.locator('header img');
    await expect(logo).toBeVisible();
    
    // Check for main title (handle newline with regex)
    await expect(page.getByRole('heading', { name: /Scale Your/i })).toBeVisible();
  });

  test('should navigate to the next slide when clicking Next', async ({ page }) => {
    await page.goto('/');
    
    // Click Continue button (target the first visible one)
    await page.getByRole('button', { name: /continue/i }).first().click();
    
    // Verify next slide title is visible
    await expect(page.getByRole('heading', { name: /Promote with/i })).toBeVisible();
  });
});
