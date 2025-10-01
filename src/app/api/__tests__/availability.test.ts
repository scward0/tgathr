// Import only the service layer for testing
import * as availabilityService from '@/lib/services/availability-service';
import { isErrorResponse } from '@/lib/types/service-responses';

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
      const invalidData = {
        eventId: 'event-123',
        participantToken: ''
      };
      const result = availabilityService.validateAvailabilityData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.status).toBe(400);
      }
    });

    it('should validate valid availability data', () => {
      const validData = {
        eventId: 'event-123',
        participantToken: 'test-token',
        timeSlots: [
          {
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T17:00:00Z',
          },
        ],
      };

      const result = availabilityService.validateAvailabilityData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.participantToken).toBe('test-token');
        expect(result.data?.eventId).toBe('event-123');
      }
    });
  });
});