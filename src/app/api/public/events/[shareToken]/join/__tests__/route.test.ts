/**
 * @jest-environment node
 */
import { POST } from '../route';
import { prismaMock, resetAllMocks, testFixtures } from '@/lib/testing/mocks';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('@/lib/sms', () => ({
  sendSMSOptInConfirmation: jest.fn()
}));

describe('POST /api/public/events/[shareToken]/join', () => {
  const mockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body)
    } as unknown as Request;
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

  describe('Successful registration', () => {
    it('should create participant with valid name only', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.basic,
        id: 'new-participant-id',
        token: 'new-edit-token-123'
      } as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.participantId).toBe('new-participant-id');
      expect(data.editToken).toBe('new-edit-token-123');
      expect(data.message).toBe('Registration successful');

      expect(prismaMock.participant.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          phoneNumber: null,
          token: expect.any(String),
          smsOptIn: false,
          smsOptInAt: null,
          events: {
            connect: { id: 'event-123' }
          }
        }
      });
    });

    it('should create participant with SMS opt-in and phone number', async () => {
      const smsModule = await import('@/lib/sms');

      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.withSMS,
        id: 'new-participant-sms-id',
        token: 'new-edit-token-sms'
      } as any);

      (smsModule.sendSMSOptInConfirmation as jest.Mock).mockResolvedValue(undefined);

      const request = mockRequest({
        name: 'Jane Smith',
        phoneNumber: '+15551234567',
        smsOptIn: true
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.participantId).toBe('new-participant-sms-id');
      expect(data.editToken).toBe('new-edit-token-sms');

      expect(prismaMock.participant.create).toHaveBeenCalledWith({
        data: {
          name: 'Jane Smith',
          phoneNumber: '+15551234567',
          token: expect.any(String),
          smsOptIn: true,
          smsOptInAt: expect.any(Date),
          events: {
            connect: { id: 'event-123' }
          }
        }
      });

      expect(smsModule.sendSMSOptInConfirmation).toHaveBeenCalledWith(
        '+15551234567',
        'Jane Smith',
        'Team Meeting'
      );
    });

    it('should record smsOptInAt timestamp when opting in', async () => {
      const beforeTime = new Date();

      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);

      let capturedData: any;
      prismaMock.participant.create.mockImplementation((args) => {
        capturedData = args.data;
        return Promise.resolve({
          ...testFixtures.participant.withSMS,
          id: 'new-id',
          token: 'new-token'
        } as any);
      });

      const request = mockRequest({
        name: 'Jane Smith',
        phoneNumber: '+15551234567',
        smsOptIn: true
      });

      await POST(request, mockParams);

      expect(capturedData.smsOptInAt).toBeInstanceOf(Date);
      expect(capturedData.smsOptInAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should handle SMS service failure gracefully', async () => {
      const smsModule = await import('@/lib/sms');

      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.withSMS,
        id: 'new-participant-id',
        token: 'new-token'
      } as any);

      (smsModule.sendSMSOptInConfirmation as jest.Mock).mockRejectedValue(
        new Error('SMS service unavailable')
      );

      const request = mockRequest({
        name: 'Jane Smith',
        phoneNumber: '+15551234567',
        smsOptIn: true
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      // Registration should still succeed even if SMS fails
      expect(response.status).toBe(200);
      expect(data.participantId).toBe('new-participant-id');
    });

    it('should generate unique UUID token for each participant', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);

      let capturedToken: string;
      prismaMock.participant.create.mockImplementation((args) => {
        capturedToken = args.data.token;
        return Promise.resolve({
          ...testFixtures.participant.basic,
          token: capturedToken
        } as any);
      });

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      await POST(request, mockParams);

      // UUID v4 format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(capturedToken!).toMatch(uuidRegex);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing name', async () => {
      const request = mockRequest({
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for empty name', async () => {
      const request = mockRequest({
        name: '',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should return 400 for name that is too long', async () => {
      const request = mockRequest({
        name: 'A'.repeat(101), // 101 characters
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should return 400 when opting in to SMS without phone number', async () => {
      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: true
        // phoneNumber missing
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number is required when opting in to SMS notifications');
    });

    it('should return 400 when opting in to SMS with empty phone number', async () => {
      const request = mockRequest({
        name: 'John Doe',
        phoneNumber: '',
        smsOptIn: true
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number is required when opting in to SMS notifications');
    });
  });

  describe('Event validation', () => {
    it('should return 404 for invalid share token', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Event not found');
    });

    it('should return 400 for finalized event', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.finalized as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This event has already been finalized');
    });

    it('should return 400 for expired event', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.expired as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This event has expired');
    });
  });

  describe('Error handling', () => {
    it('should return 503 when database is unavailable during build', async () => {
      delete process.env.DATABASE_URL;

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not available during build');
    });

    it('should return 500 when participant creation fails', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockRejectedValue(
        new Error('Database connection error')
      );

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to register participant');
    });

    it('should return 500 when request body is malformed', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Request;

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to register participant');
    });
  });

  describe('Edge cases', () => {
    it('should allow registration without phone number when not opting in to SMS', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.withoutPhone,
        id: 'new-id',
        token: 'new-token'
      } as any);

      const request = mockRequest({
        name: 'Alice Brown',
        smsOptIn: false
        // phoneNumber not provided
      });

      const response = await POST(request, mockParams);

      expect(response.status).toBe(200);
      expect(prismaMock.participant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: null,
          smsOptIn: false,
          smsOptInAt: null
        })
      });
    });

    it('should allow phone number without SMS opt-in', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.basic,
        id: 'new-id',
        token: 'new-token'
      } as any);

      const request = mockRequest({
        name: 'John Doe',
        phoneNumber: '+15551234567',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);

      expect(response.status).toBe(200);
      expect(prismaMock.participant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '+15551234567',
          smsOptIn: false,
          smsOptInAt: null
        })
      });
    });

    it('should handle multi-day event registration', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.multiDay as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.basic,
        id: 'new-id',
        token: 'new-token'
      } as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);

      expect(response.status).toBe(200);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'test-share-token-123' },
        select: {
          id: true,
          name: true,
          isFinalized: true,
          expiresAt: true
        }
      });
    });

    it('should handle registration at the expiration boundary', async () => {
      const almostExpiredEvent = {
        ...testFixtures.event.basic,
        expiresAt: new Date(Date.now() + 1000) // Expires in 1 second
      };

      prismaMock.event.findUnique.mockResolvedValue(almostExpiredEvent as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.basic,
        id: 'new-id',
        token: 'new-token'
      } as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);

      expect(response.status).toBe(200);
    });
  });

  describe('Response format', () => {
    it('should return correct response structure on success', async () => {
      prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
      prismaMock.participant.create.mockResolvedValue({
        ...testFixtures.participant.basic,
        id: 'participant-id-123',
        token: 'edit-token-456'
      } as any);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('participantId');
      expect(data).toHaveProperty('editToken');
      expect(data).toHaveProperty('message');
      expect(typeof data.participantId).toBe('string');
      expect(typeof data.editToken).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return correct error response structure', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const request = mockRequest({
        name: 'John Doe',
        smsOptIn: false
      });

      const response = await POST(request, mockParams);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
