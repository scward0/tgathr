/**
 * @jest-environment node
 */
import { GET } from '../route';
import { prismaMock, resetAllMocks } from '@/lib/testing/mocks';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('@/lib/calendar/icsGenerator', () => ({
  generateICS: jest.fn(() => 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n'),
  generateICSFilename: jest.fn((name: string) => `${name}.ics`),
}));

const { generateICS, generateICSFilename } = require('@/lib/calendar/icsGenerator');

const mockRequest = () => {
  return {} as Request;
};

const mockParams = (shareToken: string = 'test-share-token') => {
  return { params: { shareToken } };
};

describe('GET /api/events/[shareToken]/calendar', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test';
    (generateICS as jest.Mock).mockReturnValue(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n'
    );
    (generateICSFilename as jest.Mock).mockReturnValue('event.ics');
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe('successful calendar generation', () => {
    it('should return ICS file for finalized event with valid shareToken', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        description: 'Quarterly planning',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());

      expect(response.status).toBe(200);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'test-share-token' },
        select: {
          id: true,
          name: true,
          description: true,
          finalStartDate: true,
          finalEndDate: true,
          isFinalized: true,
        },
      });

      expect(generateICS).toHaveBeenCalledWith({
        eventName: 'Team Meeting',
        eventDescription: 'Quarterly planning',
        startDateTime: mockEvent.finalStartDate,
        endDateTime: mockEvent.finalEndDate,
        eventId: 'event-123',
      });

      expect(generateICSFilename).toHaveBeenCalledWith('Team Meeting');
    });

    it('should return correct content-type header', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());

      expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8');
    });

    it('should return content-disposition header with filename', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);
      (generateICSFilename as jest.Mock).mockReturnValue('Team-Meeting.ics');

      const request = mockRequest();
      const response = await GET(request, mockParams());

      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="Team-Meeting.ics"'
      );
    });

    it('should return cache-control headers', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());

      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
    });

    it('should handle event without description', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        description: null,
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());

      expect(response.status).toBe(200);
      expect(generateICS).toHaveBeenCalledWith(
        expect.objectContaining({
          eventDescription: undefined,
        })
      );
    });

    it('should return ICS content in response body', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      const icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nSUMMARY:Test Event\r\nEND:VCALENDAR\r\n';
      (generateICS as jest.Mock).mockReturnValue(icsContent);
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());

      const responseText = await response.text();
      expect(responseText).toBe(icsContent);
    });
  });

  describe('error handling', () => {
    it('should return 404 for invalid shareToken', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const request = mockRequest();
      const response = await GET(request, mockParams('invalid-token'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Event not found');
    });

    it('should return 400 if event is not finalized', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: null,
        finalEndDate: null,
        isFinalized: false,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event is not finalized yet');
    });

    it('should return 400 if event is marked finalized but missing finalStartDate', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: null,
        finalEndDate: new Date('2024-01-18T16:00:00.000Z'),
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event is not finalized yet');
    });

    it('should return 400 if event is marked finalized but missing finalEndDate', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Team Meeting',
        finalStartDate: new Date('2024-01-18T14:00:00.000Z'),
        finalEndDate: null,
        isFinalized: true,
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const request = mockRequest();
      const response = await GET(request, mockParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event is not finalized yet');
    });

    it('should return 500 on database error', async () => {
      prismaMock.event.findUnique.mockRejectedValue(new Error('Database error'));

      const request = mockRequest();
      const response = await GET(request, mockParams());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate calendar file');
    });

    it('should return 503 if database is not available during build', async () => {
      delete process.env.DATABASE_URL;

      const request = mockRequest();
      const response = await GET(request, mockParams());
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not available during build');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Database error');
      prismaMock.event.findUnique.mockRejectedValue(error);

      const request = mockRequest();
      await GET(request, mockParams());

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating calendar file:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
