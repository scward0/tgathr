import { createEvent, validateEventData } from '../event-service';
import { prisma } from '@/lib/prisma';
import { sendEventInvitation } from '@/lib/email';
import { randomUUID } from 'crypto';
import { isErrorResponse } from '@/lib/types/service-responses';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendEventInvitation: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (randomUUID as jest.Mock).mockReturnValue('test-uuid');
  });

  describe('validateEventData', () => {
    it('should validate and parse valid single-day event data', () => {
      const validData = {
        name: 'Test Event',
        description: 'Test Description',
        eventType: 'single-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-20',
        preferredTime: 'morning',
        duration: '2-hours',
      };

      const result = validateEventData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.name).toBe('Test Event');
        expect(result.data?.eventType).toBe('single-day');
      }
    });

    it('should validate and parse valid multi-day event data', () => {
      const validData = {
        name: 'Team Retreat',
        eventType: 'multi-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-30',
        eventLength: '3-days',
        timingPreference: 'weekends-only',
      };

      const result = validateEventData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.name).toBe('Team Retreat');
        expect(result.data?.eventType).toBe('multi-day');
      }
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        name: 'Te', // Too short
        eventType: 'invalid-type',
      };

      const result = validateEventData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.details).toBeDefined();
        expect(result.status).toBe(400);
      }
    });

    it('should return error for missing required fields', () => {
      const incompleteData = {
        name: 'Test Event',
      };

      const result = validateEventData(incompleteData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.status).toBe(400);
      }
    });

    it('should handle non-object input gracefully', () => {
      const result = validateEventData('not an object');

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Invalid input data');
        expect(result.status).toBe(400);
      }
    });

    it('should handle null input', () => {
      const result = validateEventData(null);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Invalid input data');
        expect(result.status).toBe(400);
      }
    });

    it('should convert date strings to Date objects', () => {
      const validData = {
        name: 'Test Event',
        eventType: 'single-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-20',
        preferredTime: 'morning',
        duration: '2-hours',
      };

      const result = validateEventData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.availabilityStartDate).toBeInstanceOf(Date);
        expect(result.data?.availabilityEndDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('createEvent', () => {
    const mockUser = {
      id: 'user-123',
      displayName: 'Test User',
      primaryEmail: 'user@example.com',
    };

    const validEventData = {
      name: 'Test Event',
      description: 'Test Description',
      eventType: 'single-day' as const,
      availabilityStartDate: new Date('2024-01-15'),
      availabilityEndDate: new Date('2024-01-20'),
      preferredTime: 'morning' as const,
      duration: '2-hours' as const,
    };

    it('should create an event successfully', async () => {
      const mockCreatedEvent = {
        id: 'event-123',
        name: validEventData.name,
        description: validEventData.description,
        eventType: validEventData.eventType,
        shareToken: 'test-share-token-123',
        creatorId: mockUser.id,
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

      const result = await createEvent(validEventData, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.id).toBe('event-123');
        expect(result.data?.name).toBe('Test Event');
        expect(result.data?.shareToken).toBe('test-share-token-123');
      }
    });

    it('should handle database failure', async () => {
      (prisma.event.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await createEvent(validEventData, mockUser);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to create event');
        expect(result.status).toBe(500);
      }
    });

    it('should handle validation error gracefully', async () => {
      const invalidEventData = {
        name: 'A', // Too short
        eventType: 'invalid-type' as any,
      } as any;

      (prisma.event.create as jest.Mock).mockRejectedValue(
        new Error('Validation failed')
      );

      const result = await createEvent(invalidEventData, mockUser);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to create event');
        expect(result.status).toBe(500);
      }
    });

    it('should handle multi-day event creation', async () => {
      const multiDayEventData = {
        name: 'Team Retreat',
        eventType: 'multi-day' as const,
        availabilityStartDate: new Date('2024-02-01'),
        availabilityEndDate: new Date('2024-02-28'),
        eventLength: '3-days' as const,
        timingPreference: 'consecutive' as const,
      };

      const mockCreatedEvent = {
        id: 'event-456',
        name: multiDayEventData.name,
        eventType: multiDayEventData.eventType,
        eventLength: multiDayEventData.eventLength,
        timingPreference: multiDayEventData.timingPreference,
        shareToken: 'test-share-token-456',
        preferredTime: null,
        duration: null,
        creatorId: mockUser.id,
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

      const result = await createEvent(multiDayEventData, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.id).toBe('event-456');
        expect(result.data?.eventType).toBe('multi-day');
        expect(result.data?.shareToken).toBe('test-share-token-456');
      }
    });

    it('should handle user without displayName or email', async () => {
      const minimalUser = {
        id: 'user-456',
      };

      const mockCreatedEvent = {
        id: 'event-123',
        name: validEventData.name,
        description: validEventData.description,
        eventType: validEventData.eventType,
        shareToken: 'test-share-token-789',
        creatorId: minimalUser.id,
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

      const result = await createEvent(validEventData, minimalUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.creator.name).toBe('Event Organizer');
        expect(result.data?.creator.email).toBe('');
      }
    });
  });
});