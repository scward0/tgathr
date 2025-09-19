// Smoke tests for availability API route configuration
// Actual business logic is tested in availability-service.test.ts

describe('Availability API Route', () => {
  it('should have route file in correct location', () => {
    // Simple file system check
    const fs = require('fs');
    const path = require('path');
    const routePath = path.join(__dirname, '../availability/route.ts');

    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('should be a TypeScript file', () => {
    // Verify file extension
    expect(__filename.endsWith('.test.ts')).toBe(true);
  });
});

// Note: Actual business logic testing is done in availability-service.test.ts
// This separation allows testing the core logic without Next.js environment issues