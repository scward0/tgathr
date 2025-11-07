/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextResponse } from 'next/server';
import { prismaMock, resetAllMocks, testFixtures } from '@/lib/testing/mocks';
import * as email from '@/lib/email';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('@/lib/email', () => ({
  sendEventConfirmation: jest.fn()
}));

jest.mock('@/lib/sms', () => ({
  sendEventConfirmation: jest.fn()
}));

describe('POST /api/events/[id]/finalize', () => {
  const mockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body)
    } as unknown as Request;
  };

  const mockParams = { params: { id: 'event-123' } };

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe('Successful finalization', () => {
    it('should finalize an event with valid dates', async () => {
      const finalStartDate = new Date('2024-01-18T09:00:00Z');
      const finalEndDate = new Date('2024-01-18T17:00:00Z');

      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        name: 'Team Meeting',
        shareToken: 'abc123',
        finalStartDate,
        finalEndDate,
        isFinalized: true,
        participants: [
          {
            ...testFixtures.participant.basic,
            email: 'john@example.com',
            phoneNumber: null,
            smsOptIn: false
          },
          {
            ...testFixtures.participant.multiple[0],
            email: 'alice@example.com',
            phoneNumber: null,
            smsOptIn: false
          }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: finalStartDate.toISOString(),
        finalEndDate: finalEndDate.toISOString()
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event.id).toBe('event-123');
      expect(data.event.isFinalized).toBe(true);
      expect(data.emailsSent).toBe(2);
      expect(data.totalParticipants).toBe(2);

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          finalStartDate: expect.any(Date),
          finalEndDate: expect.any(Date),
          isFinalized: true
        },
        select: {
          id: true,
          name: true,
          shareToken: true,
          finalStartDate: true,
          finalEndDate: true,
          isFinalized: true,
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              smsOptIn: true,
            },
          },
        }
      });
    });

    it('should send confirmation emails only to participants with email addresses', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' },
          { ...testFixtures.participant.withoutEmail, email: '' }, // No email
          { ...testFixtures.participant.multiple[0], email: 'alice@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.emailsSent).toBe(2); // Only 2 emails sent (1 participant has no email)
      expect(data.totalParticipants).toBe(3);
      expect(email.sendEventConfirmation).toHaveBeenCalledTimes(2);
    });

    it('should handle partial email failures gracefully', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' },
          { ...testFixtures.participant.multiple[0], email: 'alice@example.com' },
          { ...testFixtures.participant.multiple[1], email: 'bob@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);

      // Mock first email success, second failure, third success
      (email.sendEventConfirmation as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Email service error'))
        .mockResolvedValueOnce(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailsSent).toBe(2); // 2 succeeded, 1 failed
      expect(data.totalParticipants).toBe(3);
    });

    it('should include correct event details in confirmation emails', async () => {
      const finalStartDate = new Date('2024-01-18T09:00:00Z');
      const finalEndDate = new Date('2024-01-18T17:00:00Z');

      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate,
        finalEndDate,
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, name: 'John Doe', email: 'john@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: finalStartDate.toISOString(),
        finalEndDate: finalEndDate.toISOString()
      });

      await POST(request, mockParams);

      expect(email.sendEventConfirmation).toHaveBeenCalledWith(
        'john@example.com',
        'John Doe',
        'Team Meeting',
        'Event Organizer',
        finalStartDate,
        finalEndDate,
        'Your event "Team Meeting" has been finalized! Please save the date.',
        'http://localhost:3000/events/event-123',
        'event-123'
      );
    });

    it('should handle events with no participants', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: []
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailsSent).toBe(0);
      expect(data.totalParticipants).toBe(0);
      expect(email.sendEventConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 503 when database is unavailable during build', async () => {
      delete process.env.DATABASE_URL;

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not available during build');
    });

    it('should return 500 when event not found', async () => {
      prismaMock.event.update.mockRejectedValue(
        new Error('Record to update not found')
      );

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to finalize event');
    });

    it('should return 500 when database update fails', async () => {
      prismaMock.event.update.mockRejectedValue(
        new Error('Database connection error')
      );

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to finalize event');
    });

    it('should handle invalid date format in request body', async () => {
      prismaMock.event.update.mockRejectedValue(
        new Error('Invalid date')
      );

      const request = mockRequest({
        finalStartDate: 'invalid-date',
        finalEndDate: 'invalid-date'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to finalize event');
    });

    it('should handle missing request body fields', async () => {
      prismaMock.event.update.mockRejectedValue(
        new Error('Missing required fields')
      );

      const request = mockRequest({});

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to finalize event');
    });

    it('should handle malformed JSON in request', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Request;

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to finalize event');
    });
  });

  describe('Edge cases', () => {
    it('should handle already finalized event', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: []
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);

      const request = mockRequest({
        finalStartDate: '2024-01-19T09:00:00Z', // Different date
        finalEndDate: '2024-01-19T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      // Should still succeed - allows updating finalized dates
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle multi-day event finalization', async () => {
      const finalStartDate = new Date('2024-02-10T00:00:00Z');
      const finalEndDate = new Date('2024-02-13T23:59:59Z');

      const mockEvent = {
        ...testFixtures.event.multiDay,
        id: 'event-456',
        finalStartDate,
        finalEndDate,
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: finalStartDate.toISOString(),
        finalEndDate: finalEndDate.toISOString()
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.event.id).toBe('event-456');
    });

    it('should handle participants with null email field', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' },
          { ...testFixtures.participant.withoutEmail, email: null as any }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.emailsSent).toBe(1); // Only 1 email sent
      expect(email.sendEventConfirmation).toHaveBeenCalledTimes(1);
    });

    it('should handle large number of participants', async () => {
      const participants = Array.from({ length: 100 }, (_, i) => ({
        ...testFixtures.participant.basic,
        id: `participant-${i}`,
        name: `Participant ${i}`,
        email: `participant${i}@example.com`
      }));

      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.emailsSent).toBe(100);
      expect(data.totalParticipants).toBe(100);
      expect(email.sendEventConfirmation).toHaveBeenCalledTimes(100);
    });

    it('should use correct base URL from environment', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://tgathr.app';

      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      await POST(request, mockParams);

      expect(email.sendEventConfirmation).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Date),
        expect.any(Date),
        expect.any(String),
        'https://tgathr.app/events/event-123',
        'event-123'
      );
    });
  });

  describe('Response format', () => {
    it('should return correct response structure on success', async () => {
      const mockEvent = {
        ...testFixtures.event.basic,
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T09:00:00Z'),
        finalEndDate: new Date('2024-01-18T17:00:00Z'),
        isFinalized: true,
        participants: [
          { ...testFixtures.participant.basic, email: 'john@example.com' }
        ]
      };

      prismaMock.event.update.mockResolvedValue(mockEvent as any);
      (email.sendEventConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('event');
      expect(data).toHaveProperty('emailsSent');
      expect(data).toHaveProperty('totalParticipants');

      expect(data.event).toHaveProperty('id');
      expect(data.event).toHaveProperty('name');
      expect(data.event).toHaveProperty('isFinalized');
    });

    it('should return correct error response structure', async () => {
      prismaMock.event.update.mockRejectedValue(
        new Error('Database error')
      );

      const request = mockRequest({
        finalStartDate: '2024-01-18T09:00:00Z',
        finalEndDate: '2024-01-18T17:00:00Z'
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
