import { test, expect } from '@playwright/test';

test('has title and loads landing page', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/SuviX/i);

  // Check if main features are visible (e.g., Explore or Reels)
  const reelsLink = page.getByRole('link', { name: /reels/i });
  if (await reelsLink.count() > 0) {
    await expect(reelsLink).toBeVisible();
  }
});

test('check explore page responsiveness', async ({ page }) => {
  await page.goto('/explore');
  await expect(page).toHaveURL(/.*explore/);
});
