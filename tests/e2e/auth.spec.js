const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page (where AuthForm is likely a modal or a page)
    await page.goto('/');
  });

  test('should show login form and handle invalid credentials', async ({ page }) => {
    // Open the auth modal
    await page.getByRole('button', { name: /get started free/i }).click();

    // Check if "Welcome Back" is visible
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Fill in wrong credentials
    await page.getByPlaceholder(/email address/i).fill('invalid@test.com');
    await page.getByPlaceholder(/password/i).fill('wrongpass');

    // Click Continue
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Check for error message (this depends on your backend response)
    // Assuming "Invalid credentials" or similar appears
    await expect(page.getByText(/invalid/i).first()).toBeVisible();
  });

  test('should toggle to signup flow', async ({ page }) => {
    // Open the auth modal
    await page.getByRole('button', { name: /get started free/i }).click();

    // Click "Sign Up" button
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for "Create Account"
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/full name/i)).toBeVisible();
  });
});
