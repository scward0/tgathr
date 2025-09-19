import { TestDatabaseManager } from '@/lib/test-setup'
import { POST as eventsPost } from '../events/route'

// Mock Next.js Web APIs for testing environment
const globalRequestMock = global.Request
const globalResponseMock = global.Response

beforeAll(() => {
  // Mock Web API globals that Next.js expects
  if (!global.Request) {
    global.Request = class Request {
      constructor(public url: string, public init?: RequestInit) {}

      json() {
        return Promise.resolve(this.mockBody)
      }

      mockBody: any
    } as any
  }

  if (!global.Response) {
    global.Response = class Response {
      constructor(public body?: any, public init?: ResponseInit) {}

      get status() {
        return this.init?.status || 200
      }

      json() {
        return Promise.resolve(this.body)
      }
    } as any
  }
})

afterAll(() => {
  global.Request = globalRequestMock
  global.Response = globalResponseMock
})

// Mock Neon Auth
const mockUser = {
  id: 'test-user-id',
  displayName: 'Test User',
  primaryEmail: 'test@example.com'
}

const mockStackServerApp = {
  getUser: jest.fn() as jest.MockedFunction<any>
}

const mockSendEventInvitation = jest.fn(() => Promise.resolve({ success: true, messageId: 'test-message-id' }))

// Set default mock behavior
mockStackServerApp.getUser.mockResolvedValue(mockUser)

jest.mock('@/lib/stack', () => ({
  stackServerApp: mockStackServerApp
}))

// Mock email service
jest.mock('@/lib/email', () => ({
  sendEventInvitation: mockSendEventInvitation
}))

describe('/api/events POST', () => {
  beforeAll(async () => {
    await TestDatabaseManager.setupDatabase()
  })

  beforeEach(async () => {
    await TestDatabaseManager.cleanDatabase()
  })

  afterAll(async () => {
    await TestDatabaseManager.teardownDatabase()
  })

  const createValidRequest = (overrides = {}) => ({
    name: 'Team Meeting',
    description: 'Weekly team sync',
    eventType: 'single-day',
    availabilityStartDate: '2024-01-15T00:00:00Z',
    availabilityEndDate: '2024-01-20T23:59:59Z',
    preferredTime: 'morning',
    duration: '2-hours',
    participants: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com'
      }
    ],
    ...overrides
  })

  const createMockRequest = (body: any) => {
    const request = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }) as any

    // Mock the json method to return our test data
    request.json = jest.fn().mockResolvedValue(body)
    request.mockBody = body

    return request
  }

  it('should create a single-day event successfully', async () => {
    const requestBody = createValidRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(201)
    expect(responseData).toMatchObject({
      success: true,
      id: expect.any(String),
      name: 'Team Meeting',
      description: 'Weekly team sync',
      eventType: 'single-day',
      creator: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      },
      participants: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: 'John Doe',
          token: expect.any(String)
        }),
        expect.objectContaining({
          id: expect.any(String),
          name: 'Jane Smith',
          token: expect.any(String)
        })
      ])
    })

    // Verify participants were created with correct data
    expect(responseData.participants).toHaveLength(2)
    expect(responseData.participants.every((p: any) => p.token && p.id)).toBe(true)
  })

  it('should create a multi-day event successfully', async () => {
    const requestBody = createValidRequest({
      eventType: 'multi-day',
      eventLength: '3-days',
      timingPreference: 'weekends-only',
      preferredTime: undefined,
      duration: undefined
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(201)
    expect(responseData).toMatchObject({
      success: true,
      eventType: 'multi-day'
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    // Mock unauthorized user
    mockStackServerApp.getUser.mockResolvedValueOnce(null)

    const requestBody = createValidRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(401)
    expect(responseData).toEqual({ error: 'Unauthorized' })

    // Restore mock
    mockStackServerApp.getUser.mockResolvedValue(mockUser)
  })

  it('should return 400 for invalid event data', async () => {
    const invalidRequestBody = createValidRequest({
      name: 'AB', // Too short
      eventType: 'invalid-type'
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error',
      details: expect.any(Array)
    })
    expect(responseData.details.length).toBeGreaterThan(0)
  })

  it('should return 400 when required single-day fields are missing', async () => {
    const invalidRequestBody = createValidRequest({
      eventType: 'single-day',
      preferredTime: undefined,
      duration: undefined
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error'
    })
  })

  it('should return 400 when required multi-day fields are missing', async () => {
    const invalidRequestBody = createValidRequest({
      eventType: 'multi-day',
      eventLength: undefined,
      timingPreference: undefined,
      preferredTime: undefined,
      duration: undefined
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error'
    })
  })

  it('should return 400 when participants array is empty', async () => {
    const invalidRequestBody = createValidRequest({
      participants: []
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error'
    })
  })

  it('should return 400 when participant email is invalid', async () => {
    const invalidRequestBody = createValidRequest({
      participants: [
        {
          name: 'John Doe',
          email: 'invalid-email',
          phoneNumber: '+1234567890'
        }
      ]
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error'
    })
  })

  it('should return 400 when availability end date is before start date', async () => {
    const invalidRequestBody = createValidRequest({
      availabilityStartDate: '2024-01-20T00:00:00Z',
      availabilityEndDate: '2024-01-15T23:59:59Z' // Before start date
    })
    const mockRequest = createMockRequest(invalidRequestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toMatchObject({
      error: 'Validation error'
    })
  })

  it('should set correct expiration date for events', async () => {
    const requestBody = createValidRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(201)

    // Verify event was created in database with correct expiration
    const client = await TestDatabaseManager.getClient()
    const event = await client.event.findUnique({
      where: { id: responseData.id }
    })

    expect(event).toBeTruthy()
    expect(event!.expiresAt.getTime()).toBeGreaterThan(Date.now())

    // Should be approximately 30 days from now (within 1 hour tolerance)
    const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const timeDiff = Math.abs(event!.expiresAt.getTime() - expectedExpiry.getTime())
    expect(timeDiff).toBeLessThan(60 * 60 * 1000) // Within 1 hour
  })

  it('should call email service for participants with email addresses', async () => {
    mockSendEventInvitation.mockClear()

    const requestBody = createValidRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)

    expect(response.status).toBe(201)
    expect(mockSendEventInvitation).toHaveBeenCalledTimes(2) // 2 participants with emails

    // Verify email parameters
    expect(mockSendEventInvitation).toHaveBeenCalledWith(
      'john@example.com',
      'John Doe',
      'Team Meeting',
      'Test User',
      expect.stringContaining('/respond/')
    )
    expect(mockSendEventInvitation).toHaveBeenCalledWith(
      'jane@example.com',
      'Jane Smith',
      'Team Meeting',
      'Test User',
      expect.stringContaining('/respond/')
    )
  })

  it('should skip email sending for participants without email addresses', async () => {
    mockSendEventInvitation.mockClear()

    const requestBody = createValidRequest({
      participants: [
        {
          name: 'John Doe',
          phoneNumber: '+1234567890'
          // No email
        }
      ]
    })
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)

    expect(response.status).toBe(201)
    expect(mockSendEventInvitation).not.toHaveBeenCalled()
  })

  it('should return 503 when database is not available', async () => {
    // Temporarily remove DATABASE_URL
    const originalDbUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    const requestBody = createValidRequest()
    const mockRequest = createMockRequest(requestBody)

    const response = await eventsPost(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(503)
    expect(responseData).toEqual({ error: 'Database not available during build' })

    // Restore DATABASE_URL
    process.env.DATABASE_URL = originalDbUrl
  })
})