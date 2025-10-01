import { createEvent, validateEventData } from '../event-service';
import { prisma } from '@/lib/prisma';
import { sendEventInvitation } from '@/lib/email';
import { randomUUID } from 'crypto';
import { isErrorResponse } from '@/lib/types/service-responses';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
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
        participants: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
          },
        ],
      };

      const result = validateEventData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.name).toBe('Test Event');
        expect(result.data?.eventType).toBe('single-day');
        expect(result.data?.participants).toBeDefined();
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
        participants: [
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phoneNumber: '',
          },
        ],
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
        participants: [],
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
        participants: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '',
          },
        ],
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
      participants: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: '',
        },
      ],
    };

    it('should create an event successfully', async () => {
      const mockCreatedEvent = {
        id: 'event-123',
        name: validEventData.name,
        description: validEventData.description,
        eventType: validEventData.eventType,
        participants: [
          {
            id: 'participant-1',
            name: 'John Doe',
            email: 'john@example.com',
            token: 'test-uuid',
          },
          {
            id: 'participant-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            token: 'test-uuid',
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Create mock context for transaction
        const mockTx = {
          participant: {
            create: jest.fn()
              .mockResolvedValueOnce({
                id: 'participant-1',
                name: 'John Doe',
                email: 'john@example.com',
                token: 'test-uuid',
              })
              .mockResolvedValueOnce({
                id: 'participant-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                token: 'test-uuid',
              }),
          },
          event: {
            create: jest.fn().mockResolvedValue(mockCreatedEvent),
          },
        };
        return callback(mockTx);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      const result = await createEvent(validEventData, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.id).toBe('event-123');
        expect(result.data?.name).toBe('Test Event');
        expect(result.data?.participants).toHaveLength(2);
        expect(result.data?.emailResults).toHaveLength(2);
      }
    });

    it('should handle transaction failure', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await createEvent(validEventData, mockUser);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to create event');
        expect(result.status).toBe(500);
      }
    });

    it('should create event without sending emails for participants without email', async () => {
      const eventDataNoEmail = {
        ...validEventData,
        participants: [
          {
            name: 'John Doe',
            email: '',
            phoneNumber: '+1234567890',
          },
        ],
      };

      const mockCreatedEvent = {
        id: 'event-123',
        name: eventDataNoEmail.name,
        description: eventDataNoEmail.description,
        eventType: eventDataNoEmail.eventType,
        participants: [
          {
            id: 'participant-1',
            name: 'John Doe',
            email: '',
            token: 'test-uuid',
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          participant: {
            create: jest.fn().mockResolvedValue({
              id: 'participant-1',
              name: 'John Doe',
              email: '',
              token: 'test-uuid',
            }),
          },
          event: {
            create: jest.fn().mockResolvedValue(mockCreatedEvent),
          },
        };
        return callback(mockTx);
      });

      const result = await createEvent(eventDataNoEmail, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.emailResults).toHaveLength(0);
      }
      expect(sendEventInvitation).not.toHaveBeenCalled();
    });

    it('should handle validation error gracefully', async () => {
      const invalidEventData = {
        name: 'A', // Too short
        eventType: 'invalid-type' as any,
        participants: [],
      } as any;

      (prisma.$transaction as jest.Mock).mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const result = await createEvent(invalidEventData, mockUser);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to create event');
        expect(result.status).toBe(500);
      }
    });

    it('should handle email sending failures gracefully', async () => {
      const mockCreatedEvent = {
        id: 'event-123',
        name: validEventData.name,
        description: validEventData.description,
        eventType: validEventData.eventType,
        participants: [
          {
            id: 'participant-1',
            name: 'John Doe',
            email: 'john@example.com',
            token: 'test-uuid',
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          participant: {
            create: jest.fn().mockResolvedValue({
              id: 'participant-1',
              name: 'John Doe',
              email: 'john@example.com',
              token: 'test-uuid',
            }),
          },
          event: {
            create: jest.fn().mockResolvedValue(mockCreatedEvent),
          },
        };
        return callback(mockTx);
      });

      (sendEventInvitation as jest.Mock).mockRejectedValue(
        new Error('Email service down')
      );

      // Event should still be created successfully even if email fails
      const result = await createEvent(validEventData, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.id).toBe('event-123');
        expect(result.data?.emailResults).toBeDefined();
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
        participants: [
          {
            name: 'Alice Brown',
            email: 'alice@example.com',
            phoneNumber: '',
          },
        ],
      };

      const mockCreatedEvent = {
        id: 'event-456',
        name: multiDayEventData.name,
        eventType: multiDayEventData.eventType,
        eventLength: multiDayEventData.eventLength,
        timingPreference: multiDayEventData.timingPreference,
        preferredTime: null,
        duration: null,
        participants: [
          {
            id: 'participant-1',
            name: 'Alice Brown',
            email: 'alice@example.com',
            token: 'test-uuid',
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          participant: {
            create: jest.fn().mockResolvedValue({
              id: 'participant-1',
              name: 'Alice Brown',
              email: 'alice@example.com',
              token: 'test-uuid',
            }),
          },
          event: {
            create: jest.fn().mockResolvedValue(mockCreatedEvent),
          },
        };
        return callback(mockTx);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'msg-456',
      });

      const result = await createEvent(multiDayEventData, mockUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.id).toBe('event-456');
        expect(result.data?.eventType).toBe('multi-day');
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
        participants: [
          {
            id: 'participant-1',
            name: 'John Doe',
            email: 'john@example.com',
            token: 'test-uuid',
          },
          {
            id: 'participant-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            token: 'test-uuid',
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          participant: {
            create: jest.fn()
              .mockResolvedValueOnce({
                id: 'participant-1',
                name: 'John Doe',
                email: 'john@example.com',
                token: 'test-uuid',
              })
              .mockResolvedValueOnce({
                id: 'participant-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                token: 'test-uuid',
              }),
          },
          event: {
            create: jest.fn().mockResolvedValue(mockCreatedEvent),
          },
        };
        return callback(mockTx);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      const result = await createEvent(validEventData, minimalUser);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.creator.name).toBe('Event Organizer');
        expect(result.data?.creator.email).toBe('');
      }
    });
  });
});