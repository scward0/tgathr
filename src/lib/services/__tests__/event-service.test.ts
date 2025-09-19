import { createEvent, validateEventData } from '../event-service';
import { prisma } from '@/lib/prisma';
import { sendEventInvitation } from '@/lib/email';
import { randomUUID } from 'crypto';

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

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('name', 'Test Event');
      expect(result).toHaveProperty('eventType', 'single-day');
      expect(result).toHaveProperty('participants');
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

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('name', 'Team Retreat');
      expect(result).toHaveProperty('eventType', 'multi-day');
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        name: 'Te', // Too short
        eventType: 'invalid-type',
        participants: [],
      };

      const result = validateEventData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('status', 400);
    });

    it('should return error for missing required fields', () => {
      const incompleteData = {
        name: 'Test Event',
      };

      const result = validateEventData(incompleteData);

      expect(result).toHaveProperty('error', 'Validation error');
      expect(result).toHaveProperty('status', 400);
    });

    it('should handle non-object input gracefully', () => {
      const result = validateEventData('not an object');

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('status', 400);
    });

    it('should handle null input', () => {
      const result = validateEventData(null);

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('status', 400);
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

      if (!('error' in result)) {
        expect(result.availabilityStartDate).toBeInstanceOf(Date);
        expect(result.availabilityEndDate).toBeInstanceOf(Date);
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

    it('should create an event successfully', async () => {
      const mockCreatedParticipant = {
        id: 'participant-1',
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        token: 'test-uuid',
      };

      const mockCreatedEvent = {
        id: 'event-123',
        ...validEventData,
        creatorId: mockUser.id,
        creatorName: mockUser.displayName,
        creatorEmail: mockUser.primaryEmail,
      };

      const mockTransaction = {
        participant: {
          create: jest.fn().mockResolvedValue(mockCreatedParticipant),
        },
        event: {
          create: jest.fn().mockResolvedValue(mockCreatedEvent),
        },
        eventParticipant: {
          create: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTransaction);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({ success: true });

      const result = await createEvent(validEventData, mockUser);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id', 'event-123');
      expect(result).toHaveProperty('name', 'Test Event');
      expect(mockTransaction.participant.create).toHaveBeenCalled();
      expect(mockTransaction.event.create).toHaveBeenCalled();
      expect(sendEventInvitation).toHaveBeenCalled();
    });

    it('should handle multiple participants', async () => {
      const multiParticipantData = {
        ...validEventData,
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

      const mockTransaction = {
        participant: {
          create: jest.fn().mockImplementation((data) => ({
            id: `participant-${Math.random()}`,
            ...data.data,
          })),
        },
        event: {
          create: jest.fn().mockResolvedValue({
            id: 'event-123',
            ...multiParticipantData,
          }),
        },
        eventParticipant: {
          create: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTransaction);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({ success: true });

      const result = await createEvent(multiParticipantData, mockUser);

      expect(result).toHaveProperty('success', true);
      expect(mockTransaction.participant.create).toHaveBeenCalledTimes(2);
      expect(sendEventInvitation).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-day events correctly', async () => {
      const multiDayEventData = {
        name: 'Team Retreat',
        eventType: 'multi-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-30'),
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

      const mockTransaction = {
        participant: {
          create: jest.fn().mockResolvedValue({
            id: 'participant-1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phoneNumber: '',
            token: 'test-uuid',
          }),
        },
        event: {
          create: jest.fn().mockResolvedValue({
            id: 'event-123',
            ...multiDayEventData,
            creatorId: mockUser.id,
          }),
        },
        eventParticipant: {
          create: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTransaction);
      });

      (sendEventInvitation as jest.Mock).mockResolvedValue({ success: true });

      const result = await createEvent(multiDayEventData, mockUser);

      expect(result).toHaveProperty('success', true);
      expect(mockTransaction.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'multi-day',
            eventLength: '3-days',
            timingPreference: 'weekends-only',
          }),
        })
      );
    });

    it('should handle database transaction errors', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await createEvent(validEventData, mockUser);

      expect(result).toHaveProperty('error', 'Failed to create event');
      expect(result).toHaveProperty('details', 'Database connection failed');
      expect(result).toHaveProperty('status', 500);
    });

    it('should handle email sending failures gracefully', async () => {
      const mockTransaction = {
        participant: {
          create: jest.fn().mockResolvedValue({
            id: 'participant-1',
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
            token: 'test-uuid',
          }),
        },
        event: {
          create: jest.fn().mockResolvedValue({
            id: 'event-123',
            name: 'Test Event',
            creatorId: mockUser.id,
            creatorName: mockUser.displayName,
            creatorEmail: mockUser.primaryEmail,
          }),
        },
        eventParticipant: {
          create: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTransaction);
      });

      (sendEventInvitation as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const result = await createEvent(validEventData, mockUser);

      // Event should still be created successfully even if email fails
      // The email error is caught and the result array has the error, but event creation succeeds
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id', 'event-123');
      expect(result).toHaveProperty('emailResults');
    });

    it('should handle unknown errors', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue('Unknown error');

      const result = await createEvent(validEventData, mockUser);

      expect(result).toHaveProperty('error', 'Failed to create event');
      expect(result).toHaveProperty('details', 'Unknown error');
      expect(result).toHaveProperty('status', 500);
    });
  });
});