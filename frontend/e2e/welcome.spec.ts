import { test, expect } from '@playwright/test';

test.describe('Welcome Page E2E', () => {
  test('should load the welcome page and display the logo', async ({ page }) => {
    await page.goto('/');
    
    // Check for logo
    const logo = page.locator('header img');
    await expect(logo).toBeVisible();
    
    // Check for main title (using specific text to handle multiple slides in DOM)
    await expect(page.getByRole('heading', { name: 'Scale Your Content' })).toBeVisible();
  });

  test('should navigate to the next slide when clicking Next', async ({ page }) => {
    await page.goto('/');
    
    // Click Next button (target the first visible one)
    await page.getByRole('button', { name: /next/i }).first().click();
    
    // Verify next slide title is visible
    await expect(page.getByRole('heading', { name: 'Promote with Power' })).toBeVisible();
  });
});
