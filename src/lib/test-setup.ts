import { PrismaClient as TestPrismaClient } from '../generated/test-client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Test database setup utilities
export class TestDatabaseManager {
  private static testClient: TestPrismaClient | null = null

  static async getClient(): Promise<TestPrismaClient> {
    if (!this.testClient) {
      this.testClient = new TestPrismaClient()
      await this.testClient.$connect()
    }
    return this.testClient
  }

  static async setupDatabase(): Promise<void> {
    try {
      // Generate test Prisma client
      await execAsync('npx prisma generate --schema=./prisma/schema.test.prisma')
      
      // Push schema to test database
      await execAsync('npx prisma db push --schema=./prisma/schema.test.prisma --force-reset')
      
      console.log('Test database setup completed')
    } catch (error) {
      console.error('Test database setup failed:', error)
      throw error
    }
  }

  static async cleanDatabase(): Promise<void> {
    const client = await this.getClient()
    
    // Clean up data in reverse dependency order
    await client.timeSlot.deleteMany()
    await client.participant.deleteMany()
    await client.event.deleteMany()
  }

  static async teardownDatabase(): Promise<void> {
    if (this.testClient) {
      await this.testClient.$disconnect()
      this.testClient = null
    }
  }

  static async createTestEvent(data: {
    name: string
    eventType: 'single-day' | 'multi-day'
    availabilityStartDate: Date
    availabilityEndDate: Date
    creatorId: string
    preferredTime?: string
    duration?: string
    eventLength?: string
    timingPreference?: string
  }) {
    const client = await this.getClient()
    return client.event.create({
      data: {
        ...data,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })
  }

  static async createTestParticipant(data: {
    name: string
    phoneNumber: string
    email?: string
    token: string
  }) {
    const client = await this.getClient()
    return client.participant.create({ data })
  }

  static async createTestTimeSlot(data: {
    startTime: Date
    endTime: Date
    eventId: string
    participantId: string
  }) {
    const client = await this.getClient()
    return client.timeSlot.create({ data })
  }
}

// Mock data generators
export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  name: 'Test Event',
  eventType: 'single-day' as const,
  availabilityStartDate: new Date('2024-01-15'),
  availabilityEndDate: new Date('2024-01-20'),
  preferredTime: 'evening',
  duration: '2-hours',
  creatorId: 'test-creator',
  ...overrides
})

export const createMockParticipant = (overrides = {}) => ({
  id: 'test-participant-id',
  name: 'Test Participant',
  hasResponded: true,
  timeSlots: [],
  ...overrides
})

export const createMockTimeSlot = (overrides = {}) => ({
  startTime: new Date('2024-01-16T19:00:00Z'),
  endTime: new Date('2024-01-16T21:00:00Z'),
  participantId: 'test-participant-id',
  participantName: 'Test Participant',
  ...overrides
})