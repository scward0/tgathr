import { NextResponse } from 'next/server';
import { GET } from '../route';

// Mock Stack authentication
jest.mock('@/lib/stack', () => ({
  stackServerApp: {
    getUser: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn()
    }
  }
}));

// Import after mocking
import { stackServerApp } from '@/lib/stack';
import { prisma } from '@/lib/prisma';

describe('GET /api/events/my-events', () => {
  const mockUser = {
    id: 'user-123',
    displayName: 'Test User',
    primaryEmail: 'test@example.com'
  };

  const mockRequest = new Request('http://localhost:3000/api/events/my-events');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns user events when authenticated', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.events).toEqual([]);
    });
  });

  describe('Event Data Structure', () => {
    it('returns basic event information for active events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Active Event',
          description: 'Test event',
          eventType: 'single-day',
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-20'),
          isFinalized: false,
          finalStartDate: null,
          finalEndDate: null,
          createdAt: new Date('2024-01-10T10:00:00Z'),
          updatedAt: new Date('2024-01-10T10:00:00Z'),
          expiresAt: new Date('2025-12-31T23:59:59Z'),
          _count: { participants: 5 },
          participants: [
            { timeSlots: [{ id: '1' }] },
            { timeSlots: [{ id: '2' }] },
            { timeSlots: [] }
          ]
        }
      ];

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events[0]).toMatchObject({
        id: 'event-1',
        name: 'Active Event',
        description: 'Test event',
        eventType: 'single-day',
        isFinalized: false,
        participantCount: 5,
        respondedParticipants: 2,
        allResponded: false
      });
    });

    it('returns enhanced data for finalized events (US-014)', async () => {
      const finalizedDate = new Date('2024-01-15T10:00:00Z');
      const createdDate = new Date('2024-01-01T10:00:00Z');
      const mockFinalizedEvents = [
        {
          id: 'finalized-1',
          name: 'Completed Event',
          description: 'A completed event',
          eventType: 'single-day',
          availabilityStartDate: new Date('2024-01-01'),
          availabilityEndDate: new Date('2024-01-10'),
          isFinalized: true,
          finalStartDate: new Date('2024-01-18T14:00:00Z'),
          finalEndDate: new Date('2024-01-18T16:00:00Z'),
          createdAt: createdDate,
          updatedAt: finalizedDate,
          expiresAt: new Date('2025-12-31T23:59:59Z'),
          _count: { participants: 10 },
          participants: [
            { timeSlots: [{ id: '1' }] },
            { timeSlots: [{ id: '2' }] },
            { timeSlots: [{ id: '3' }] },
            { timeSlots: [{ id: '4' }] },
            { timeSlots: [{ id: '5' }] },
            { timeSlots: [{ id: '6' }] },
            { timeSlots: [{ id: '7' }] },
            { timeSlots: [{ id: '8' }] },
            { timeSlots: [] },
            { timeSlots: [] }
          ]
        }
      ];

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockFinalizedEvents);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events[0]).toMatchObject({
        id: 'finalized-1',
        name: 'Completed Event',
        isFinalized: true,
        participantCount: 10,
        respondedParticipants: 8
      });

      // Check for enhanced finalized event fields
      expect(data.events[0].finalStartDate).toBeTruthy();
      expect(data.events[0].finalEndDate).toBeTruthy();
      expect(data.events[0].finalizedAt).toBeTruthy();
      expect(data.events[0].daysSinceFinalized).toBeDefined();
      expect(typeof data.events[0].daysSinceFinalized).toBe('number');
    });

    it('calculates daysSinceFinalized correctly for finalized events', async () => {
      // Mock a finalized event from 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      const mockFinalizedEvent = {
        id: 'finalized-1',
        name: 'Completed Event',
        description: 'Test',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-01'),
        availabilityEndDate: new Date('2024-01-10'),
        isFinalized: true,
        finalStartDate: new Date('2024-01-18T14:00:00Z'),
        finalEndDate: new Date('2024-01-18T16:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: fiveDaysAgo,
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 5 },
        participants: [
          { timeSlots: [{ id: '1' }] }
        ]
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockFinalizedEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0].daysSinceFinalized).toBeGreaterThanOrEqual(4);
      expect(data.events[0].daysSinceFinalized).toBeLessThanOrEqual(6);
    });

    it('returns null for daysSinceFinalized for non-finalized events', async () => {
      const mockActiveEvent = {
        id: 'event-1',
        name: 'Active Event',
        description: 'Test',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        isFinalized: false,
        finalStartDate: null,
        finalEndDate: null,
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 5 },
        participants: []
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockActiveEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0].daysSinceFinalized).toBeNull();
      expect(data.events[0].finalizedAt).toBeNull();
    });

    it('handles multi-day finalized events correctly', async () => {
      const mockMultiDayEvent = {
        id: 'multi-day-1',
        name: 'Multi-Day Event',
        description: 'Test',
        eventType: 'multi-day',
        availabilityStartDate: new Date('2024-01-01'),
        availabilityEndDate: new Date('2024-01-10'),
        isFinalized: true,
        finalStartDate: new Date('2024-01-20T00:00:00Z'),
        finalEndDate: new Date('2024-01-25T00:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-12T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 8 },
        participants: [
          { timeSlots: [{ id: '1' }] },
          { timeSlots: [{ id: '2' }] }
        ]
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockMultiDayEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0]).toMatchObject({
        id: 'multi-day-1',
        eventType: 'multi-day',
        isFinalized: true
      });
      expect(data.events[0].finalStartDate).toBeTruthy();
      expect(data.events[0].finalEndDate).toBeTruthy();
    });
  });

  describe('Response Rate Calculation', () => {
    it('calculates respondedParticipants correctly', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Test Event',
        description: 'Test',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        isFinalized: false,
        finalStartDate: null,
        finalEndDate: null,
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 5 },
        participants: [
          { timeSlots: [{ id: '1' }] }, // responded
          { timeSlots: [{ id: '2' }] }, // responded
          { timeSlots: [] }, // not responded
          { timeSlots: [] }, // not responded
          { timeSlots: [] }  // not responded
        ]
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0].participantCount).toBe(5);
      expect(data.events[0].respondedParticipants).toBe(2);
      expect(data.events[0].allResponded).toBe(false);
    });

    it('sets allResponded to true when all participants have responded', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Test Event',
        description: 'Test',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        isFinalized: false,
        finalStartDate: null,
        finalEndDate: null,
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 3 },
        participants: [
          { timeSlots: [{ id: '1' }] },
          { timeSlots: [{ id: '2' }] },
          { timeSlots: [{ id: '3' }] }
        ]
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0].allResponded).toBe(true);
    });

    it('handles events with no participants', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Test Event',
        description: 'Test',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        isFinalized: false,
        finalStartDate: null,
        finalEndDate: null,
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        _count: { participants: 0 },
        participants: []
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.events[0].participantCount).toBe(0);
      expect(data.events[0].respondedParticipants).toBe(0);
      expect(data.events[0].allResponded).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 503 during build time when database is not available', async () => {
      const originalEnv = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not available during build');

      process.env.DATABASE_URL = originalEnv;
    });
  });

  describe('Query Structure', () => {
    it('fetches events with correct relations and ordering', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await GET(mockRequest);

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: mockUser.id
        },
        include: {
          participants: {
            include: {
              timeSlots: true
            }
          },
          _count: {
            select: { participants: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });
  });
});
