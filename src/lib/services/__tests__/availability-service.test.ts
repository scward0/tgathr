import { saveAvailability, validateAvailabilityData } from '../availability-service';
import { prisma } from '@/lib/prisma';

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
  },
}));

describe('Availability Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAvailabilityData', () => {
    it('should validate valid availability data', () => {
      const validData = {
        token: 'test-token-123',
        timeSlots: [
          {
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            date: '2024-01-16',
            startTime: '10:00',
            endTime: '16:00',
          },
        ],
      };

      const result = validateAvailabilityData(validData);

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('token', 'test-token-123');
      expect(result).toHaveProperty('timeSlots');
      if (!('error' in result)) {
        expect(result.timeSlots).toHaveLength(2);
        expect(result.timeSlots[0]).toHaveProperty('date', '2024-01-15');
      }
    });

    it('should reject invalid token', () => {
      const invalidData = {
        token: '',
        timeSlots: [
          {
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
      expect(result).toHaveProperty('status', 400);
    });

    it('should reject empty time slots', () => {
      const invalidData = {
        token: 'test-token',
        timeSlots: [],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
      expect(result).toHaveProperty('details');
    });

    it('should reject invalid time slot format', () => {
      const invalidData = {
        token: 'test-token',
        timeSlots: [
          {
            date: 'invalid-date',
            startTime: '25:00', // Invalid time
            endTime: '26:00',
          },
        ],
      };

      const result = validateAvailabilityData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        token: 'test-token',
        // Missing timeSlots
      };

      const result = validateAvailabilityData(invalidData);

      expect(result).toHaveProperty('error', 'Validation error');
    });

    it('should handle non-object input', () => {
      const result = validateAvailabilityData('not an object');

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('status', 400);
    });

    it('should handle null input', () => {
      const result = validateAvailabilityData(null);

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('status', 400);
    });
  });

  describe('saveAvailability', () => {
    const validAvailabilityData = {
      token: 'test-token-123',
      timeSlots: [
        {
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          date: '2024-01-16',
          startTime: '10:00',
          endTime: '16:00',
        },
      ],
    };

    const mockParticipant = {
      id: 'participant-123',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      token: 'test-token-123',
    };

    it('should save availability successfully', async () => {
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.availability.create as jest.Mock).mockImplementation((data) => ({
        id: 'availability-' + Math.random(),
        ...data.data,
      }));
      (prisma.availability.findMany as jest.Mock).mockResolvedValue([
        {
          participantId: 'participant-123',
          date: new Date('2024-01-15'),
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          participantId: 'participant-123',
          date: new Date('2024-01-16'),
          startTime: '10:00',
          endTime: '16:00',
        },
      ]);

      const result = await saveAvailability(validAvailabilityData);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('participantName', 'John Doe');
      expect(result).toHaveProperty('savedSlots', 2);
      expect(result).toHaveProperty('availability');
      expect(prisma.participant.findUnique).toHaveBeenCalledWith({
        where: { token: 'test-token-123' },
      });
      expect(prisma.availability.create).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid token', async () => {
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await saveAvailability(validAvailabilityData);

      expect(result).toHaveProperty('error', 'Invalid participant token');
      expect(result).toHaveProperty('status', 404);
      expect(prisma.availability.create).not.toHaveBeenCalled();
    });

    it('should handle database errors when finding participant', async () => {
      (prisma.participant.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await saveAvailability(validAvailabilityData);

      expect(result).toHaveProperty('error', 'Failed to save availability');
      expect(result).toHaveProperty('details', 'Database connection failed');
      expect(result).toHaveProperty('status', 500);
    });

    it('should handle database errors when creating availability', async () => {
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.availability.create as jest.Mock).mockRejectedValue(
        new Error('Failed to insert availability')
      );

      const result = await saveAvailability(validAvailabilityData);

      expect(result).toHaveProperty('error', 'Failed to save availability');
      expect(result).toHaveProperty('details', 'Failed to insert availability');
      expect(result).toHaveProperty('status', 500);
    });

    it('should handle single time slot', async () => {
      const singleSlotData = {
        token: 'test-token-123',
        timeSlots: [
          {
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.availability.create as jest.Mock).mockResolvedValue({
        id: 'availability-1',
        participantId: 'participant-123',
        date: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '17:00',
      });
      (prisma.availability.findMany as jest.Mock).mockResolvedValue([
        {
          participantId: 'participant-123',
          date: new Date('2024-01-15'),
          startTime: '09:00',
          endTime: '17:00',
        },
      ]);

      const result = await saveAvailability(singleSlotData);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('savedSlots', 1);
      expect(prisma.availability.create).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown errors', async () => {
      (prisma.participant.findUnique as jest.Mock).mockRejectedValue('Unknown error');

      const result = await saveAvailability(validAvailabilityData);

      expect(result).toHaveProperty('error', 'Failed to save availability');
      expect(result).toHaveProperty('details', 'Unknown error');
      expect(result).toHaveProperty('status', 500);
    });

    it('should convert date strings to Date objects when creating availability', async () => {
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.availability.create as jest.Mock).mockImplementation((data) => ({
        id: 'availability-1',
        ...data.data,
      }));
      (prisma.availability.findMany as jest.Mock).mockResolvedValue([]);

      await saveAvailability(validAvailabilityData);

      expect(prisma.availability.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: expect.any(Date),
            startTime: '09:00',
            endTime: '17:00',
          }),
        })
      );
    });
  });
});