// Import only the service layer for testing
import * as availabilityService from '@/lib/services/availability-service';

// Don't mock the service - test it directly
// This provides real coverage of the service functions

describe('Availability API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Availability service integration', () => {
    it('should have route file in correct location', () => {
      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../availability/route.ts');

      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should validate availability data correctly', () => {
      const invalidData = { token: '' };
      const result = availabilityService.validateAvailabilityData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
      expect(result).toHaveProperty('status', 400);
    });

    it('should validate valid availability data', () => {
      const validData = {
        token: 'test-token',
        timeSlots: [
          {
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      const result = availabilityService.validateAvailabilityData(validData);

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('token', 'test-token');
    });
  });
});