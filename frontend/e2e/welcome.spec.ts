import { test, expect } from '@playwright/test';

test.describe('Welcome Page E2E', () => {
  test('should load the welcome page and display the logo', async ({ page }) => {
    await page.goto('/');
    
    // Check for logo
    const logo = page.locator('header img');
    await expect(logo).toBeVisible();
    
    // Check for main title
    const title = page.locator('h1');
    await expect(title).toContainText('Scale Your Content');
  });

  test('should navigate to the next slide when clicking Next', async ({ page }) => {
    await page.goto('/');
    
    // Click Next button
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify title has changed using auto-retrying assertion
    // We use a regex to handle the potential newlines in the title
    await expect(page.locator('h1')).toHaveText(/Promote with Power/i);
  });
});
