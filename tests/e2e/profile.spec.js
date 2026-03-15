const { test, expect } = require('@playwright/test');

test.describe('Profile Navigation', () => {
  test('should redirect unauthenticated users away from editor profile', async ({ page }) => {
    // Attempt to access a protected route directly
    await page.goto('/editor-profile');

    // Expected behavior: Unauthenticated users are redirected back to the root '/'
    await expect(page).toHaveURL('/');
  });

  test('should redirect unauthenticated users away from client profile', async ({ page }) => {
    // Attempt to access a protected route directly
    await page.goto('/client-profile');

    // Expected behavior: Unauthenticated users are redirected back to the root '/'
    await expect(page).toHaveURL('/');
  });
});
