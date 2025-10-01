// Import only the service layer for testing
import * as eventService from '@/lib/services/event-service';
import { isErrorResponse } from '@/lib/types/service-responses';

// Don't mock the service - test it directly
// This provides real coverage of the service functions

describe('Events API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event service integration', () => {
    it('should have route file in correct location', () => {
      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../events/route.ts');

      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should validate event data correctly', () => {
      const invalidData = { name: 'Te' }; // Too short
      const result = eventService.validateEventData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.status).toBe(400);
      }
    });

    it('should validate valid event data', () => {
      const validData = {
        name: 'Test Event',
        eventType: 'single-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-20',
        preferredTime: 'morning',
        duration: '2-hours',
        participants: [
          { name: 'John', email: 'john@example.com', phoneNumber: '' }
        ],
      };

      const result = eventService.validateEventData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.name).toBe('Test Event');
      }
    });
  });
});