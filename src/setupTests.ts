import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Prisma Client - only if the module exists
try {
  jest.mock('@/lib/prisma', () => ({
    prisma: {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
      event: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      participant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      timeSlot: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    },
  }))
} catch (_error) {
  // Prisma module doesn't exist yet, skip mocking
}

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db',
  NEXTAUTH_SECRET: 'test-secret',
  STACK_PROJECT_ID: 'test-stack-project',
  EMAIL_FROM: 'test@example.com',
}

// Global test utilities
declare global {
  namespace globalThis {
    const mockDate: (date: string) => void
    const restoreDate: () => void
  }
}

(global as any).mockDate = (date: string) => {
  jest.spyOn(global.Date, 'now').mockImplementation(() => new Date(date).getTime())
}

(global as any).restoreDate = () => {
  jest.spyOn(global.Date, 'now').mockRestore()
}