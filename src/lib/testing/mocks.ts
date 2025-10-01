import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Prisma Mock
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

export const resetAllMocks = () => {
  mockReset(prismaMock);
};

// Test Data Fixtures
export const testFixtures = {
  event: {
    basic: {
      id: 'event-123',
      name: 'Team Meeting',
      description: 'Monthly team sync',
      eventType: 'single-day',
      availabilityStartDate: new Date('2024-01-15'),
      availabilityEndDate: new Date('2024-01-20'),
      preferredTime: 'morning',
      duration: 60,
      eventLength: null,
      timingPreference: null,
      finalStartDate: null,
      finalEndDate: null,
      isFinalized: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      creatorId: 'creator-123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    multiDay: {
      id: 'event-456',
      name: 'Workshop',
      description: 'Technical workshop',
      eventType: 'multi-day',
      availabilityStartDate: new Date('2024-02-01'),
      availabilityEndDate: new Date('2024-02-28'),
      preferredTime: null,
      duration: null,
      eventLength: 3,
      timingPreference: 'consecutive',
      finalStartDate: null,
      finalEndDate: null,
      isFinalized: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      creatorId: 'creator-456',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },

  participant: {
    basic: {
      id: 'participant-123',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      token: 'test-token-123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    withoutEmail: {
      id: 'participant-456',
      name: 'Jane Smith',
      email: '',
      phoneNumber: '+0987654321',
      token: 'test-token-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    multiple: [
      {
        id: 'participant-001',
        name: 'Alice Brown',
        email: 'alice@example.com',
        phoneNumber: '',
        token: 'token-001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'participant-002',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phoneNumber: '',
        token: 'token-002',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'participant-003',
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        phoneNumber: '',
        token: 'token-003',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },

  timeSlot: {
    single: {
      id: 'slot-123',
      eventId: 'event-123',
      participantId: 'participant-123',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T17:00:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    multiple: [
      {
        id: 'slot-001',
        eventId: 'event-123',
        participantId: 'participant-123',
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T12:00:00'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'slot-002',
        eventId: 'event-123',
        participantId: 'participant-123',
        startTime: new Date('2024-01-16T14:00:00'),
        endTime: new Date('2024-01-16T17:00:00'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'slot-003',
        eventId: 'event-123',
        participantId: 'participant-456',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T16:00:00'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },

  availability: {
    validSubmission: {
      token: 'test-token-123',
      timeSlots: [
        {
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '17:00'
        },
        {
          date: '2024-01-16',
          startTime: '10:00',
          endTime: '16:00'
        }
      ]
    },
    invalidSubmission: {
      token: '',
      timeSlots: []
    },
    singleSlot: {
      token: 'test-token-456',
      timeSlots: [
        {
          date: '2024-01-20',
          startTime: '14:00',
          endTime: '18:00'
        }
      ]
    }
  },

  eventFormData: {
    singleDay: {
      name: 'Team Meeting',
      description: 'Monthly team sync',
      eventType: 'single-day',
      availabilityStartDate: new Date('2024-01-15'),
      availabilityEndDate: new Date('2024-01-20'),
      preferredTime: 'morning',
      duration: 60,
      participants: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: ''
        }
      ]
    },
    multiDay: {
      name: 'Workshop',
      description: 'Technical workshop',
      eventType: 'multi-day',
      availabilityStartDate: new Date('2024-02-01'),
      availabilityEndDate: new Date('2024-02-28'),
      eventLength: 3,
      timingPreference: 'consecutive',
      participants: [
        {
          name: 'Alice Brown',
          email: 'alice@example.com',
          phoneNumber: ''
        },
        {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          phoneNumber: ''
        },
        {
          name: 'Charlie Davis',
          email: 'charlie@example.com',
          phoneNumber: ''
        }
      ]
    }
  },

  user: {
    authenticated: {
      id: 'user-123',
      displayName: 'Test User',
      primaryEmail: 'test@example.com'
    },
    minimal: {
      id: 'user-456',
      displayName: undefined,
      primaryEmail: undefined
    }
  }
};

// Mock Setup Functions
export function setupPrismaMocks() {
  // Default mock implementations
  prismaMock.$transaction.mockImplementation(async (callback: any) => {
    // Pass the mock prisma client to the transaction callback
    return callback(prismaMock);
  });

  prismaMock.participant.findUnique.mockResolvedValue(null);
  prismaMock.participant.create.mockResolvedValue(testFixtures.participant.basic);
  prismaMock.participant.findMany.mockResolvedValue([]);

  prismaMock.event.create.mockResolvedValue({
    ...testFixtures.event.basic,
    participants: [testFixtures.participant.basic]
  } as any);
  prismaMock.event.findUnique.mockResolvedValue(testFixtures.event.basic as any);
  prismaMock.event.findMany.mockResolvedValue([]);

  prismaMock.timeSlot.create.mockResolvedValue(testFixtures.timeSlot.single as any);
  prismaMock.timeSlot.createMany.mockResolvedValue({ count: 1 });
  prismaMock.timeSlot.findMany.mockResolvedValue([]);
  prismaMock.timeSlot.deleteMany.mockResolvedValue({ count: 0 });

  // Availability removed - using TimeSlot instead
}

// Test utilities
export function createMockAvailabilityData(overrides = {}) {
  return {
    ...testFixtures.availability.validSubmission,
    ...overrides
  };
}

export function createMockEventData(overrides = {}) {
  return {
    ...testFixtures.eventFormData.singleDay,
    ...overrides
  };
}

export function createMockParticipant(overrides = {}) {
  return {
    ...testFixtures.participant.basic,
    ...overrides
  };
}

export function createMockUser(overrides = {}) {
  return {
    ...testFixtures.user.authenticated,
    ...overrides
  };
}