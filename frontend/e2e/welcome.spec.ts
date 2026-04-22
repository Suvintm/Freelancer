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
    
    const initialTitle = await page.locator('h1').innerText();
    
    // Click Next button
    await page.getByRole('button', { name: /next/i }).click();
    
    // Verify title has changed
    const newTitle = await page.locator('h1').innerText();
    expect(newTitle).not.toBe(initialTitle);
    await expect(page.locator('h1')).toContainText('Promote with Power');
  });
});
