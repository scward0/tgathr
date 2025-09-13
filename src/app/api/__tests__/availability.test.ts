import { POST as availabilityPost } from '../availability/route'
import { TestDatabaseManager } from '@/lib/test-setup'

describe('/api/availability POST', () => {
  let testEvent: any
  let testParticipant: any

  beforeAll(async () => {
    await TestDatabaseManager.setupDatabase()
  })

  beforeEach(async () => {
    await TestDatabaseManager.cleanDatabase()
    
    // Create test event and participant
    testEvent = await TestDatabaseManager.createTestEvent({
      name: 'Test Event',
      eventType: 'single-day',
      availabilityStartDate: new Date('2024-01-15'),
      availabilityEndDate: new Date('2024-01-20'),
      preferredTime: 'morning',
      duration: '2-hours',
      creatorId: 'test-creator'
    })

    testParticipant = await TestDatabaseManager.createTestParticipant({
      name: 'Test Participant',
      phoneNumber: '+1234567890',
      email: 'test@example.com',
      token: 'test-participant-token'
    })

    // Connect participant to event
    const client = await TestDatabaseManager.getClient()
    await client.event.update({
      where: { id: testEvent.id },
      data: {
        participants: {
          connect: { id: testParticipant.id }
        }
      }
    })
  })

  afterAll(async () => {
    await TestDatabaseManager.teardownDatabase()
  })

  const createValidAvailabilityRequest = (overrides = {}) => ({
    eventId: testEvent.id,
    participantToken: testParticipant.token,
    timeSlots: [
      {
        startTime: '2024-01-16T09:00:00Z',
        endTime: '2024-01-16T11:00:00Z'
      },
      {
        startTime: '2024-01-16T14:00:00Z',
        endTime: '2024-01-16T16:00:00Z'
      }
    ],
    ...overrides
  })

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body)
    } as any
  }

  it('should save availability successfully', async () => {
    const requestBody = createValidAvailabilityRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData).toMatchObject({
      success: true,
      slotsCreated: 2,
      participant: 'Test Participant'
    })

    // Verify time slots were created in database
    const client = await TestDatabaseManager.getClient()
    const timeSlots = await client.timeSlot.findMany({
      where: {
        eventId: testEvent.id,
        participantId: testParticipant.id
      }
    })

    expect(timeSlots).toHaveLength(2)
    expect(timeSlots[0]).toMatchObject({
      startTime: new Date('2024-01-16T09:00:00Z'),
      endTime: new Date('2024-01-16T11:00:00Z'),
      eventId: testEvent.id,
      participantId: testParticipant.id
    })
    expect(timeSlots[1]).toMatchObject({
      startTime: new Date('2024-01-16T14:00:00Z'),
      endTime: new Date('2024-01-16T16:00:00Z'),
      eventId: testEvent.id,
      participantId: testParticipant.id
    })
  })

  it('should replace existing time slots when resubmitting', async () => {
    const client = await TestDatabaseManager.getClient()
    
    // Create initial time slots
    await TestDatabaseManager.createTestTimeSlot({
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T12:00:00Z'),
      eventId: testEvent.id,
      participantId: testParticipant.id
    })

    // Verify initial slot exists
    let timeSlots = await client.timeSlot.findMany({
      where: {
        eventId: testEvent.id,
        participantId: testParticipant.id
      }
    })
    expect(timeSlots).toHaveLength(1)

    // Submit new availability
    const requestBody = createValidAvailabilityRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    expect(response.status).toBe(200)

    // Verify old slots were deleted and new ones created
    timeSlots = await client.timeSlot.findMany({
      where: {
        eventId: testEvent.id,
        participantId: testParticipant.id
      }
    })

    expect(timeSlots).toHaveLength(2) // Should have the 2 new slots, not 3 total
    expect(timeSlots.every(slot => 
      slot.startTime.toISOString() === '2024-01-16T09:00:00.000Z' ||
      slot.startTime.toISOString() === '2024-01-16T14:00:00.000Z'
    )).toBe(true)
  })

  it('should return 404 for invalid participant token', async () => {
    const requestBody = createValidAvailabilityRequest({
      participantToken: 'invalid-token'
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(404)
    expect(responseData).toEqual({
      error: 'Invalid participant token'
    })
  })

  it('should return 400 for missing required fields', async () => {
    const invalidRequestBody = {
      eventId: testEvent.id,
      // Missing participantToken and timeSlots
    }
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Invalid data format',
      details: expect.any(Array)
    })
  })

  it('should return 400 for invalid time slot format', async () => {
    const invalidRequestBody = createValidAvailabilityRequest({
      timeSlots: [
        {
          startTime: 'invalid-date',
          endTime: '2024-01-16T11:00:00Z'
        }
      ]
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Invalid data format'
    })
  })

  it('should return 400 for empty time slots array', async () => {
    const invalidRequestBody = createValidAvailabilityRequest({
      timeSlots: []
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(200) // Empty array is actually valid
    
    const responseData2 = await response.json()
    expect(responseData2).toMatchObject({
      success: true,
      slotsCreated: 0
    })
  })

  it('should handle malformed JSON gracefully', async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    } as any

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      error: 'Failed to save availability'
    })
  })

  it('should validate time slot structure correctly', async () => {
    const requestBody = createValidAvailabilityRequest({
      timeSlots: [
        {
          // Missing startTime
          endTime: '2024-01-16T11:00:00Z'
        }
      ]
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Invalid data format',
      details: expect.any(Array)
    })
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error for the deleteMany operation
    const mockPrisma = {
      participant: {
        findUnique: jest.fn().mockResolvedValue(testParticipant)
      },
      timeSlot: {
        deleteMany: jest.fn().mockRejectedValue(new Error('Database error')),
        createMany: jest.fn()
      }
    }
    
    jest.doMock('@/lib/prisma', () => ({
      prisma: mockPrisma
    }))

    const requestBody = createValidAvailabilityRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      error: 'Failed to save availability'
    })

    jest.unmock('@/lib/prisma')
  })

  it('should parse ISO date strings correctly', async () => {
    const requestBody = createValidAvailabilityRequest({
      timeSlots: [
        {
          startTime: '2024-01-16T09:00:00.000Z',
          endTime: '2024-01-16T11:00:00.000Z'
        }
      ]
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData).toMatchObject({
      success: true,
      slotsCreated: 1
    })

    // Verify the dates were parsed correctly
    const client = await TestDatabaseManager.getClient()
    const timeSlot = await client.timeSlot.findFirst({
      where: {
        eventId: testEvent.id,
        participantId: testParticipant.id
      }
    })

    expect(timeSlot!.startTime).toEqual(new Date('2024-01-16T09:00:00.000Z'))
    expect(timeSlot!.endTime).toEqual(new Date('2024-01-16T11:00:00.000Z'))
  })

  it('should return 503 when database is not available', async () => {
    // Temporarily remove DATABASE_URL
    const originalDbUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    const requestBody = createValidAvailabilityRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(503)
    expect(responseData).toEqual({ error: 'Database not available during build' })

    // Restore DATABASE_URL
    process.env.DATABASE_URL = originalDbUrl
  })

  it('should handle multiple time slots for the same participant', async () => {
    const requestBody = createValidAvailabilityRequest({
      timeSlots: [
        {
          startTime: '2024-01-16T09:00:00Z',
          endTime: '2024-01-16T10:00:00Z'
        },
        {
          startTime: '2024-01-16T11:00:00Z',
          endTime: '2024-01-16T12:00:00Z'
        },
        {
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T15:00:00Z'
        },
        {
          startTime: '2024-01-17T09:00:00Z',
          endTime: '2024-01-17T10:00:00Z'
        }
      ]
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await availabilityPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData).toMatchObject({
      success: true,
      slotsCreated: 4,
      participant: 'Test Participant'
    })

    // Verify all slots were created
    const client = await TestDatabaseManager.getClient()
    const timeSlots = await client.timeSlot.findMany({
      where: {
        eventId: testEvent.id,
        participantId: testParticipant.id
      },
      orderBy: { startTime: 'asc' }
    })

    expect(timeSlots).toHaveLength(4)
    expect(timeSlots[0].startTime).toEqual(new Date('2024-01-16T09:00:00Z'))
    expect(timeSlots[3].startTime).toEqual(new Date('2024-01-17T09:00:00Z'))
  })
})