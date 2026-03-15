const { test, expect } = require('@playwright/test');

test.describe('Checkout Flow', () => {

  test('should allow a client to initiate an order and open payment checkout', async ({ page }) => {

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // 1. Mock user authentication in local storage
    await page.addInitScript(() => {
      window.localStorage.setItem('user', JSON.stringify({
        _id: 'sample_client_id',
        name: 'Test Client',
        role: 'client',
        clientKycStatus: 'verified',
        token: 'fake-token'
      }));
    });

    // Mock API: Auth Me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            _id: 'sample_client_id',
            name: 'Test Client',
            role: 'client',
            clientKycStatus: 'verified'
          }
        })
      });
    });

    // 2. Mock API: Gigs list
    await page.route('**/api/gigs*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          gigs: [
            {
              _id: 'sample_gig_id',
              title: 'I will edit an amazing music video',
              price: 5000,
              deliveryDays: 3,
              category: 'Music Video',
              editor: { _id: 'sample_editor_id', name: 'Test Editor', profilePicture: '' },
            }
          ],
          pagination: { page: 1, limit: 12, total: 1, pages: 1 }
        })
      });
    });

    // 3. Mock API: Order creation
    await page.route('**/api/orders/gig', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          order: {
            _id: 'sample_order_id',
            orderNumber: 'ORD-12345',
            amount: 5000,
            title: 'I will edit an amazing music video'
          }
        })
      });
    });

    // 4. Mock API: Payment config
    await page.route('**/api/payment-gateway/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          config: {
            supported: true,
            message: ''
          }
        })
      });
    });

    // Ensure localStorage has a valid client session with KYC verified
    await page.addInitScript(() => {
      window.localStorage.setItem('user', JSON.stringify({
        _id: 'sample_client_id',
        name: 'Test Client',
        role: 'client',
        clientKycStatus: 'verified',
        token: 'fake-token'
      }));
    });

    // Go to the explore gigs tab
    await page.goto('/explore-editors?tab=gigs');

    // Wait for the mocked gig to load and be visible
    const gigTitle = page.getByText('I will edit an amazing music video').first();
    await expect(gigTitle).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for animations

    // Target the specific "Order" button inside the main gigs grid card.
    // We use getByRole with exact name or find the button directly.
    // The inner text of the button is "Order " (because of the icon), so we can match by role.
    const orderButton = page.getByRole('button', { name: /^Order$/i });
    
    // There can only be one "Order" button with this exact accessible name (Orders & Payments has different name)
    await expect(orderButton.first()).toBeVisible();
    await orderButton.first().click();

    // Verify the "Create Order" modal opens
    await expect(page.getByRole('heading', { name: /create order/i })).toBeVisible({ timeout: 10000 });

    // Fill in the required deadline (set to 2 days from now)
    const date = new Date();
    date.setDate(date.getDate() + 2);
    const dateString = date.toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(dateString);
    await dateInput.dispatchEvent('change');
    await page.keyboard.press('Escape'); // Close any native datepicker overlay
    await page.waitForTimeout(500);

    // Optional: Fill description
    await page.locator('textarea').fill('Test project requirements');

    // Wait for state updates before clicking submit (fixes WebKit flakiness)
    await page.waitForTimeout(1000);

    // Submit the order
    const paySubmitBtn = page.locator('button', { hasText: /Pay ₹5000/i }).first();
    await paySubmitBtn.scrollIntoViewIfNeeded();
    await paySubmitBtn.click({ force: true });

    // 6. Verify the RazorpayCheckout component successfully renders
    await expect(page.locator('.rzp-checkout-modal')).toBeVisible({ timeout: 10000 });
    
    // It should display the "Pay" button inside the checkout modal
    const finalPayBtn = page.locator('.rzp-pay-btn');
    await expect(finalPayBtn).toBeVisible({ timeout: 10000 });
  });
});
