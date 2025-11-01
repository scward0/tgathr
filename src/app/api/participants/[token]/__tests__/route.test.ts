/**
 * @jest-environment node
 */
import { GET, PUT } from '../route';
import { prismaMock, resetAllMocks, testFixtures } from '@/lib/testing/mocks';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

describe('Participant API Routes', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe('GET /api/participants/[token]', () => {
    const mockRequest = () => {
      return {} as Request;
    };

    const mockParams = { params: { token: 'test-token-123' } };

    describe('Successful retrieval', () => {
      it('should fetch participant and event data with valid token', async () => {
        const mockParticipant = {
          ...testFixtures.participant.basic,
          events: [testFixtures.event.basic],
          timeSlots: []
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.participant).toBeDefined();
        expect(data.event).toBeDefined();
        expect(data.participant.id).toBe('participant-123');
        expect(data.participant.name).toBe('John Doe');
        expect(data.event.id).toBe('event-123');
      });

      it('should include participant time slots', async () => {
        const mockParticipant = {
          ...testFixtures.participant.basic,
          events: [testFixtures.event.basic],
          timeSlots: [
            {
              ...testFixtures.timeSlot.single,
              startTime: new Date('2024-01-15T09:00:00Z'),
              endTime: new Date('2024-01-15T17:00:00Z')
            }
          ]
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.participant.timeSlots).toHaveLength(1);
        expect(data.participant.timeSlots[0].startTime).toBe('2024-01-15T09:00:00.000Z');
        expect(data.participant.timeSlots[0].endTime).toBe('2024-01-15T17:00:00.000Z');
      });

      it('should include SMS opt-in status', async () => {
        const mockParticipant = {
          ...testFixtures.participant.withSMS,
          events: [testFixtures.event.basic],
          timeSlots: []
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.participant.smsOptIn).toBe(true);
        expect(data.participant.phoneNumber).toBe('+15551234567');
      });

      it('should order time slots by start time', async () => {
        const mockParticipant = {
          ...testFixtures.participant.basic,
          events: [testFixtures.event.basic],
          timeSlots: testFixtures.timeSlot.multiple
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        await GET(request, mockParams);

        expect(prismaMock.participant.findUnique).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          include: {
            events: true,
            timeSlots: {
              orderBy: {
                startTime: 'asc'
              }
            }
          }
        });
      });
    });

    describe('Error handling', () => {
      it('should return 404 for invalid token', async () => {
        prismaMock.participant.findUnique.mockResolvedValue(null);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Participant not found');
      });

      it('should return 404 when participant has no events', async () => {
        const mockParticipant = {
          ...testFixtures.participant.basic,
          events: [],
          timeSlots: []
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Participant not found');
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
        prismaMock.participant.findUnique.mockRejectedValue(
          new Error('Database connection error')
        );

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch participant data');
      });
    });

    describe('Response format', () => {
      it('should return correct response structure', async () => {
        const mockParticipant = {
          ...testFixtures.participant.basic,
          events: [testFixtures.event.basic],
          timeSlots: []
        };

        prismaMock.participant.findUnique.mockResolvedValue(mockParticipant as any);

        const request = mockRequest();
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(data).toHaveProperty('participant');
        expect(data).toHaveProperty('event');
        expect(data.participant).toHaveProperty('id');
        expect(data.participant).toHaveProperty('name');
        expect(data.participant).toHaveProperty('token');
        expect(data.participant).toHaveProperty('phoneNumber');
        expect(data.participant).toHaveProperty('smsOptIn');
        expect(data.participant).toHaveProperty('timeSlots');
      });
    });
  });

  describe('PUT /api/participants/[token]', () => {
    const mockRequest = (body: any) => {
      return {
        json: jest.fn().mockResolvedValue(body)
      } as unknown as Request;
    };

    const mockParams = { params: { token: 'test-token-123' } };

    describe('Successful updates', () => {
      it('should update participant name', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          name: 'Updated Name'
        } as any);

        const request = mockRequest({
          name: 'Updated Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.participant.name).toBe('Updated Name');
        expect(data.message).toBe('Participant updated successfully');

        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: { name: 'Updated Name' }
        });
      });

      it('should update phone number', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          phoneNumber: '+15559876543'
        } as any);

        const request = mockRequest({
          phoneNumber: '+15559876543'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.participant.phoneNumber).toBe('+15559876543');
      });

      it('should opt-in to SMS with phone number', async () => {
        const beforeTime = new Date();

        let capturedData: any;
        prismaMock.participant.update.mockImplementation((args) => {
          capturedData = args.data;
          return Promise.resolve({
            ...testFixtures.participant.withSMS
          } as any);
        });

        const request = mockRequest({
          phoneNumber: '+15551234567',
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(capturedData.smsOptIn).toBe(true);
        expect(capturedData.smsOptInAt).toBeInstanceOf(Date);
        expect(capturedData.smsOptInAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      });

      it('should opt-out of SMS', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          smsOptIn: false,
          smsOptInAt: null
        } as any);

        const request = mockRequest({
          smsOptIn: false
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: {
            smsOptIn: false,
            smsOptInAt: null
          }
        });
      });

      it('should re-opt-in to SMS and update timestamp', async () => {
        // Mock the participant lookup to check for existing phone number
        prismaMock.participant.findUnique.mockResolvedValue({
          ...testFixtures.participant.basic,
          phoneNumber: '+15551234567'
        } as any);

        let capturedData: any;
        prismaMock.participant.update.mockImplementation((args) => {
          capturedData = args.data;
          return Promise.resolve({
            ...testFixtures.participant.withSMS,
            smsOptInAt: capturedData.smsOptInAt
          } as any);
        });

        const request = mockRequest({
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(capturedData.smsOptIn).toBe(true);
        expect(capturedData.smsOptInAt).toBeInstanceOf(Date);
      });

      it('should update multiple fields at once', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.withSMS,
          name: 'New Name',
          phoneNumber: '+15559999999'
        } as any);

        const request = mockRequest({
          name: 'New Name',
          phoneNumber: '+15559999999',
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: expect.objectContaining({
            name: 'New Name',
            phoneNumber: '+15559999999',
            smsOptIn: true,
            smsOptInAt: expect.any(Date)
          })
        });
      });

      it('should allow clearing phone number', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.withoutPhone
        } as any);

        const request = mockRequest({
          phoneNumber: null
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: { phoneNumber: null }
        });
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for invalid name (too short)', async () => {
        const request = mockRequest({
          name: ''
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation error');
      });

      it('should return 400 for invalid name (too long)', async () => {
        const request = mockRequest({
          name: 'A'.repeat(101)
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation error');
      });

      it('should return 400 when opting in without existing phone number', async () => {
        prismaMock.participant.findUnique.mockResolvedValue({
          ...testFixtures.participant.withoutPhone
        } as any);

        const request = mockRequest({
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Phone number is required when opting in to SMS notifications');
      });

      it('should allow SMS opt-in when phone number is provided in same request', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.withSMS
        } as any);

        const request = mockRequest({
          phoneNumber: '+15551234567',
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
      });

      it('should allow SMS opt-in when participant already has phone number', async () => {
        prismaMock.participant.findUnique.mockResolvedValue({
          ...testFixtures.participant.basic,
          phoneNumber: '+15551234567'
        } as any);

        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.withSMS
        } as any);

        const request = mockRequest({
          smsOptIn: true
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
      });
    });

    describe('Error handling', () => {
      it('should return 404 for invalid token', async () => {
        prismaMock.participant.update.mockRejectedValue({
          code: 'P2025',
          message: 'Record to update not found'
        });

        const request = mockRequest({
          name: 'New Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Participant not found');
      });

      it('should return 503 when database is unavailable during build', async () => {
        delete process.env.DATABASE_URL;

        const request = mockRequest({
          name: 'New Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error).toBe('Database not available during build');
      });

      it('should return 500 when database update fails', async () => {
        prismaMock.participant.update.mockRejectedValue(
          new Error('Database connection error')
        );

        const request = mockRequest({
          name: 'New Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update participant');
      });

      it('should return 500 when request body is malformed', async () => {
        const request = {
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
        } as unknown as Request;

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update participant');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty update request', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic
        } as any);

        const request = mockRequest({});

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: {}
        });
      });

      it('should not update smsOptInAt when opting in is not changing', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          name: 'New Name'
        } as any);

        const request = mockRequest({
          name: 'New Name'
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: { name: 'New Name' }
        });
      });

      it('should handle special characters in name', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          name: 'José García-López'
        } as any);

        const request = mockRequest({
          name: 'José García-López'
        });

        const response = await PUT(request, mockParams);

        expect(response.status).toBe(200);
        expect(prismaMock.participant.update).toHaveBeenCalledWith({
          where: { token: 'test-token-123' },
          data: { name: 'José García-López' }
        });
      });
    });

    describe('Response format', () => {
      it('should return correct response structure on success', async () => {
        prismaMock.participant.update.mockResolvedValue({
          ...testFixtures.participant.basic,
          name: 'Updated Name'
        } as any);

        const request = mockRequest({
          name: 'Updated Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(data).toHaveProperty('participant');
        expect(data).toHaveProperty('message');
        expect(data.participant).toHaveProperty('id');
        expect(data.participant).toHaveProperty('name');
        expect(data.participant).toHaveProperty('phoneNumber');
        expect(data.participant).toHaveProperty('smsOptIn');
        expect(data.participant).toHaveProperty('token');
      });

      it('should return correct error response structure', async () => {
        prismaMock.participant.update.mockRejectedValue({
          code: 'P2025'
        });

        const request = mockRequest({
          name: 'New Name'
        });

        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      });
    });
  });
});
