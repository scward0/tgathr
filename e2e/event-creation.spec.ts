import { test, expect } from '@playwright/test';

test.describe('Event Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the new event page
    await page.goto('/events/new');
  });

  test('should create a single-day event successfully', async ({ page }) => {
    // Fill in event details
    await page.fill('[data-testid="event-name"]', 'Team Meeting');
    await page.fill('[data-testid="event-description"]', 'Weekly team sync meeting');
    
    // Set availability dates
    await page.fill('[data-testid="availability-start-date"]', '2024-01-15');
    await page.fill('[data-testid="availability-end-date"]', '2024-01-20');
    
    // Select single-day options
    await page.selectOption('[data-testid="preferred-time"]', 'morning');
    await page.selectOption('[data-testid="duration"]', '2-hours');
    
    // Add participant
    await page.fill('[data-testid="participant-0-name"]', 'John Doe');
    await page.fill('[data-testid="participant-0-email"]', 'john@example.com');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Should navigate to event page
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9]+$/);
    
    // Should show success message or event details
    await expect(page.locator('text=Team Meeting')).toBeVisible();
  });

  test('should create a multi-day event successfully', async ({ page }) => {
    // Switch to multi-day event type
    await page.click('[data-testid="event-type-multi-day"]');
    
    // Fill in event details
    await page.fill('[data-testid="event-name"]', 'Team Retreat');
    await page.fill('[data-testid="event-description"]', 'Annual company retreat');
    
    // Set availability dates
    await page.fill('[data-testid="availability-start-date"]', '2024-01-15');
    await page.fill('[data-testid="availability-end-date"]', '2024-01-30');
    
    // Select multi-day options
    await page.selectOption('[data-testid="event-length"]', '3-days');
    await page.selectOption('[data-testid="timing-preference"]', 'weekends-only');
    
    // Add participants
    await page.fill('[data-testid="participant-0-name"]', 'Jane Smith');
    await page.fill('[data-testid="participant-0-email"]', 'jane@example.com');
    
    // Add second participant
    await page.click('[data-testid="add-participant"]');
    await page.fill('[data-testid="participant-1-name"]', 'Bob Johnson');
    await page.fill('[data-testid="participant-1-email"]', 'bob@example.com');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Should navigate to event page
    await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9]+$/);
    
    // Should show success message or event details
    await expect(page.locator('text=Team Retreat')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');
    
    // Should show validation errors
    await expect(page.locator('text=Event name must be at least 3 characters')).toBeVisible();
    await expect(page.locator('text=Availability start date is required')).toBeVisible();
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill in basic info but invalid email
    await page.fill('[data-testid="event-name"]', 'Test Event');
    await page.fill('[data-testid="availability-start-date"]', '2024-01-15');
    await page.fill('[data-testid="availability-end-date"]', '2024-01-20');
    await page.selectOption('[data-testid="preferred-time"]', 'morning');
    await page.selectOption('[data-testid="duration"]', '2-hours');
    await page.fill('[data-testid="participant-0-name"]', 'Test User');
    await page.fill('[data-testid="participant-0-email"]', 'invalid-email');
    
    await page.click('[data-testid="submit-button"]');
    
    // Should show email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
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

  test('should allow adding and removing participants', async ({ page }) => {
    // Should have one participant field initially
    await expect(page.locator('[data-testid="participant-0-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="participant-1-name"]')).not.toBeVisible();
    
    // Add participant
    await page.click('[data-testid="add-participant"]');
    await expect(page.locator('[data-testid="participant-1-name"]')).toBeVisible();
    
    // Add another participant
    await page.click('[data-testid="add-participant"]');
    await expect(page.locator('[data-testid="participant-2-name"]')).toBeVisible();
    
    // Remove first participant
    await page.click('[data-testid="remove-participant-0"]');
    await expect(page.locator('[data-testid="participant-0-name"]')).toBeVisible(); // Should still have participants, just reordered
    await expect(page.locator('[data-testid="participant-2-name"]')).not.toBeVisible(); // Third one should be gone
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
    await page.fill('[data-testid="participant-0-name"]', 'Test User');
    await page.fill('[data-testid="participant-0-email"]', 'test@example.com');
    
    await page.click('[data-testid="submit-button"]');
    
    // Should show error message
    await expect(page.locator('text=Validation error')).toBeVisible();
    
    // Should stay on same page
    await expect(page).toHaveURL('/events/new');
  });
});

test.describe('Availability Response Flow', () => {
  test('should allow participant to submit availability', async ({ page }) => {
    // Mock participant token and navigate to response page
    const participantToken = 'test-participant-token';
    await page.goto(`/respond/${participantToken}`);
    
    // Should show event details
    await expect(page.locator('text=Please select your availability')).toBeVisible();
    
    // Add availability time slots
    await page.click('[data-testid="add-time-slot"]');
    await page.fill('[data-testid="time-slot-0-start"]', '2024-01-16T09:00');
    await page.fill('[data-testid="time-slot-0-end"]', '2024-01-16T11:00');
    
    // Add another time slot
    await page.click('[data-testid="add-time-slot"]');
    await page.fill('[data-testid="time-slot-1-start"]', '2024-01-16T14:00');
    await page.fill('[data-testid="time-slot-1-end"]', '2024-01-16T16:00');
    
    // Submit availability
    await page.click('[data-testid="submit-availability"]');
    
    // Should show success message
    await expect(page.locator('text=Thank you for submitting your availability')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/events/new');
    
    // Form should be accessible on mobile
    await expect(page.locator('[data-testid="event-name"]')).toBeVisible();
    
    // Should be able to fill out form
    await page.fill('[data-testid="event-name"]', 'Mobile Test Event');
    await page.fill('[data-testid="availability-start-date"]', '2024-01-15');
    await page.fill('[data-testid="availability-end-date"]', '2024-01-20');
    
    // Form controls should be responsive
    await page.selectOption('[data-testid="preferred-time"]', 'morning');
    await page.selectOption('[data-testid="duration"]', '2-hours');
    
    // Should be able to add participants
    await page.fill('[data-testid="participant-0-name"]', 'Mobile User');
    await page.fill('[data-testid="participant-0-email"]', 'mobile@example.com');
    
    // Submit button should be accessible
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
  });
});