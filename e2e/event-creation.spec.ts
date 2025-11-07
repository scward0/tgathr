import { test, expect } from '@playwright/test';

test.describe('Event Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the new event page
    await page.goto('/events/new');
  });

  test('should show conditional fields based on event type', async ({ page }) => {
    // Should show single-day fields by default
    await expect(page.locator('[data-testid="preferred-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-length"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="timing-preference"]')).not.toBeVisible();

    // Switch to multi-day
    await page.click('[data-testid="event-type-multi-day"]');

    // Should show multi-day fields
    await expect(page.locator('[data-testid="event-length"]')).toBeVisible();
    await expect(page.locator('[data-testid="timing-preference"]')).toBeVisible();
    await expect(page.locator('[data-testid="preferred-time"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="duration"]')).not.toBeVisible();
  });

  test('should handle form submission errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('/api/events', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Validation error',
          details: ['Invalid event data']
        })
      });
    });

    // Fill out form with valid data
    await page.fill('[data-testid="event-name"]', 'Test Event');
    await page.fill('[data-testid="availability-start-date"]', '2024-01-15');
    await page.fill('[data-testid="availability-end-date"]', '2024-01-20');
    await page.selectOption('[data-testid="preferred-time"]', 'morning');
    await page.selectOption('[data-testid="duration"]', '2-hours');

    await page.click('[data-testid="submit-button"]');

    // Should show error message
    await expect(page.locator('text=Validation error')).toBeVisible();

    // Should stay on same page
    await expect(page).toHaveURL('/events/new');
  });
});
