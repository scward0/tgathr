/**
 * @jest-environment node
 */
import { GET } from '../route';
import { prismaMock, resetAllMocks, testFixtures } from '@/lib/testing/mocks';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

describe('GET /api/public/events/[shareToken]/details', () => {
  const mockRequest = () => {
    return {} as Request;
  };

  const mockParams = { params: { shareToken: 'test-share-token-123' } };

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe('Successful event retrieval', () => {
    it('should fetch event details with valid share token', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: [
          testFixtures.participant.basic,
          testFixtures.participant.withSMS
        ]
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event).toBeDefined();
      expect(data.event.id).toBe('event-123');
      expect(data.event.name).toBe('Team Meeting');
      expect(data.event.description).toBe('Monthly team sync');
      expect(data.event.eventType).toBe('single-day');
      expect(data.event.participantCount).toBe(2);
    });

    it('should include all event properties in response', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        eventType: expect.any(String),
        availabilityStartDate: expect.anything(),
        availabilityEndDate: expect.anything(),
        preferredTime: expect.any(String),
        duration: expect.any(Number),
        isFinalized: expect.any(Boolean),
        expiresAt: expect.anything(),
        isExpired: expect.any(Boolean),
        participantCount: expect.any(Number)
      });
    });

    it('should correctly count participants', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: testFixtures.participant.multiple.map(p => ({
          id: p.id,
          name: p.name,
          smsOptIn: p.smsOptIn,
          createdAt: p.createdAt
        }))
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.participantCount).toBe(3);
    });

    it('should handle event with no participants', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.participantCount).toBe(0);
    });
  });

  describe('Event expiration handling', () => {
    it('should set isExpired to true for expired event', async () => {
      const mockEvent = {
        ...testFixtures.event.expired,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.isExpired).toBe(true);
    });

    it('should set isExpired to false for active event', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.isExpired).toBe(false);
    });

    it('should handle event expiring right now', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        expiresAt: new Date(),
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.isExpired).toBeDefined();
    });
  });

  describe('Event type variations', () => {
    it('should handle single-day event', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.eventType).toBe('single-day');
      expect(data.event.preferredTime).toBe('morning');
      expect(data.event.duration).toBe(60);
      expect(data.event.eventLength).toBeNull();
      expect(data.event.timingPreference).toBeNull();
    });

    it('should handle multi-day event', async () => {
      const mockEvent = {
        ...testFixtures.event.multiDay,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, { params: { shareToken: 'test-share-token-456' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.eventType).toBe('multi-day');
      expect(data.event.eventLength).toBe(3);
      expect(data.event.timingPreference).toBe('consecutive');
      expect(data.event.preferredTime).toBeNull();
      expect(data.event.duration).toBeNull();
    });

    it('should include finalization status for finalized event', async () => {
      const mockEvent = {
        ...testFixtures.event.finalized,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.isFinalized).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for invalid share token', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Event not found');
    });

    it('should return 503 when database is unavailable during build', async () => {
      delete process.env.DATABASE_URL;

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not available during build');
    });

    it('should return 500 when database query fails', async () => {
      prismaMock.event.findUnique.mockRejectedValue(
        new Error('Database connection error')
      );

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch event data');
    });
  });

  describe('Database query', () => {
    it('should query with correct parameters', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      await GET(request, mockParams);

      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'test-share-token-123' },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              smsOptIn: true,
              createdAt: true
            }
          }
        }
      });
    });

    it('should not expose sensitive participant data', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: [
          {
            id: testFixtures.participant.withSMS.id,
            name: testFixtures.participant.withSMS.name,
            smsOptIn: testFixtures.participant.withSMS.smsOptIn,
            createdAt: testFixtures.participant.withSMS.createdAt,
            // These should not be included in the query
            phoneNumber: testFixtures.participant.withSMS.phoneNumber,
            email: testFixtures.participant.withSMS.email,
            token: testFixtures.participant.withSMS.token
          }
        ]
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      await GET(request, mockParams);

      // Verify we're only selecting specific fields
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'test-share-token-123' },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              smsOptIn: true,
              createdAt: true
            }
          }
        }
      });
    });
  });

  describe('Response format', () => {
    it('should return correct response structure', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('event');
      expect(data.event).toHaveProperty('id');
      expect(data.event).toHaveProperty('name');
      expect(data.event).toHaveProperty('description');
      expect(data.event).toHaveProperty('eventType');
      expect(data.event).toHaveProperty('isExpired');
      expect(data.event).toHaveProperty('participantCount');
    });

    it('should return correct error response structure', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });

  describe('Edge cases', () => {
    it('should handle event with large number of participants', async () => {
      const participants = Array.from({ length: 100 }, (_, i) => ({
        id: `participant-${i}`,
        name: `Participant ${i}`,
        smsOptIn: i % 2 === 0,
        createdAt: new Date()
      }));

      const mockEvent = {
        ...testFixtures.event.basic,
        participants
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.participantCount).toBe(100);
    });

    it('should handle event with special characters in description', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        description: 'Event with special chars: <>&"\' and unicode: 你好',
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.description).toBe('Event with special chars: <>&"\' and unicode: 你好');
    });

    it('should handle event at date boundaries', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        availabilityStartDate: new Date('2024-12-31T23:59:59Z'),
        availabilityEndDate: new Date('2025-01-01T00:00:00Z'),
        participants: []
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.availabilityStartDate).toBeDefined();
      expect(data.event.availabilityEndDate).toBeDefined();
    });
  });
});
