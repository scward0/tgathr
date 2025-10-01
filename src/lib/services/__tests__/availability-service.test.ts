import { saveAvailability, validateAvailabilityData } from '../availability-service';
import { prisma } from '@/lib/prisma';
import { isErrorResponse } from '@/lib/types/service-responses';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    participant: {
      findUnique: jest.fn(),
    },
    availability: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    timeSlot: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('Availability Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAvailabilityData', () => {
    it('should validate valid availability data', () => {
      const validData = {
        eventId: 'event-123',
        participantToken: 'test-token-123',
        timeSlots: [
          {
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T17:00:00Z',
          },
          {
            startTime: '2024-01-16T10:00:00Z',
            endTime: '2024-01-16T16:00:00Z',
          },
        ],
      };

      const result = validateAvailabilityData(validData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.eventId).toBe('event-123');
        expect(result.data?.participantToken).toBe('test-token-123');
        expect(result.data?.timeSlots).toHaveLength(2);
      }
    });

    it('should reject invalid token', () => {
      const invalidData = {
        eventId: 'event-123',
        participantToken: '',
        timeSlots: [
          {
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T17:00:00Z',
          },
        ],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.status).toBe(400);
      }
    });

    it('should reject empty time slots', () => {
      const invalidData = {
        eventId: 'event-123',
        participantToken: 'test-token',
        timeSlots: [],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
        expect(result.details).toBeDefined();
      }
    });

    it('should reject invalid time slot format', () => {
      const invalidData = {
        eventId: 'event-123',
        participantToken: 'test-token',
        timeSlots: [
          {
            startTime: 'invalid-date-format-xyz',
            endTime: 'invalid-date-format-xyz',
          },
        ],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        eventId: 'event-123',
        participantToken: 'test-token',
        // Missing timeSlots
      };

      const result = validateAvailabilityData(invalidData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
      }
    });

    it('should handle non-object input', () => {
      const result = validateAvailabilityData('not an object');

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
      }
    });

    it('should handle null input', () => {
      const result = validateAvailabilityData(null);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
      }
    });

    it('should handle undefined input', () => {
      const result = validateAvailabilityData(undefined);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Validation error');
      }
    });

    it('should transform date strings to Date objects', () => {
      const dataWithStrings = {
        eventId: 'event-123',
        participantToken: 'test-token',
        timeSlots: [
          {
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T17:00:00Z',
          },
        ],
      };

      const result = validateAvailabilityData(dataWithStrings);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.timeSlots[0].startTime).toBeInstanceOf(Date);
        expect(result.data?.timeSlots[0].endTime).toBeInstanceOf(Date);
      }
    });
  });

  describe('saveAvailability', () => {
    it('should save availability successfully', async () => {
      const validAvailabilityData = {
        eventId: 'event-123',
        participantToken: 'test-token-123',
        timeSlots: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T17:00:00Z'),
          },
          {
            startTime: new Date('2024-01-16T10:00:00Z'),
            endTime: new Date('2024-01-16T16:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'participant-123',
        name: 'John Doe',
        token: 'test-token-123',
      });

      (prisma.timeSlot.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
      (prisma.timeSlot.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 });

      const result = await saveAvailability(validAvailabilityData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.slotsCreated).toBe(2);
        expect(result.data?.participant).toBe('John Doe');
      }

      expect(prisma.participant.findUnique).toHaveBeenCalledWith({
        where: { token: 'test-token-123' },
      });
      expect(prisma.timeSlot.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            eventId: 'event-123',
            participantId: 'participant-123',
          }),
        ]),
      });
    });

    it('should handle invalid participant token', async () => {
      const invalidTokenData = {
        eventId: 'event-123',
        participantToken: 'invalid-token',
        timeSlots: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T17:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await saveAvailability(invalidTokenData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Invalid participant token');
        expect(result.status).toBe(404);
      }
    });

    it('should handle database errors', async () => {
      const validData = {
        eventId: 'event-123',
        participantToken: 'test-token-123',
        timeSlots: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T17:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'participant-123',
        name: 'John Doe',
        token: 'test-token-123',
      });

      (prisma.timeSlot.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
      (prisma.timeSlot.createMany as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await saveAvailability(validData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to save availability');
        expect(result.details).toBe('Database connection failed');
        expect(result.status).toBe(500);
      }
    });

    it('should handle single time slot', async () => {
      const singleSlotData = {
        eventId: 'event-123',
        participantToken: 'test-token-456',
        timeSlots: [
          {
            startTime: new Date('2024-01-20T14:00:00Z'),
            endTime: new Date('2024-01-20T18:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'participant-456',
        name: 'Jane Smith',
        token: 'test-token-456',
      });

      (prisma.timeSlot.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
      (prisma.timeSlot.createMany as jest.Mock).mockResolvedValueOnce({ count: 1 });

      const result = await saveAvailability(singleSlotData);

      expect(result.success).toBe(true);
      if (!isErrorResponse(result)) {
        expect(result.data?.slotsCreated).toBe(1);
      }
      expect(prisma.timeSlot.createMany).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown errors', async () => {
      const validData = {
        eventId: 'event-123',
        participantToken: 'test-token-123',
        timeSlots: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T17:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockRejectedValueOnce('Unknown error');

      const result = await saveAvailability(validData);

      expect(result.success).toBe(false);
      if (isErrorResponse(result)) {
        expect(result.error).toBe('Failed to save availability');
        expect(result.details).toBe('Unknown error');
        expect(result.status).toBe(500);
      }
    });

    it('should delete existing time slots before creating new ones', async () => {
      const validData = {
        eventId: 'event-123',
        participantToken: 'test-token-123',
        timeSlots: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T17:00:00Z'),
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'participant-123',
        name: 'John Doe',
        token: 'test-token-123',
      });

      (prisma.timeSlot.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 3 });
      (prisma.timeSlot.createMany as jest.Mock).mockResolvedValueOnce({ count: 1 });

      await saveAvailability(validData);

      expect(prisma.timeSlot.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          participantId: 'participant-123',
        },
      });
      // Verify both methods were called
      expect(prisma.timeSlot.deleteMany).toHaveBeenCalled();
      expect(prisma.timeSlot.createMany).toHaveBeenCalled();
    });
  });
});