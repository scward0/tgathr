# Testing Documentation

This document outlines the testing strategy and implementation for the tgathr project.

## Overview

The testing suite includes:
- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing API endpoints and database operations
- **Component Tests**: Testing React components with user interactions
- **End-to-End Tests**: Testing complete user workflows across the application

## Test Coverage Goals

- Minimum 85% overall test coverage for academic requirements
- 100% coverage for critical business logic (scheduling algorithm)
- 90%+ coverage for API routes and form validation
- 70%+ coverage for React components

## Test Structure

```
├── src/
│   ├── lib/__tests__/           # Unit tests for business logic
│   ├── types/__tests__/         # Schema validation tests
│   ├── components/__tests__/    # React component tests
│   └── app/api/__tests__/       # API integration tests
├── e2e/                        # Playwright E2E tests
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Test environment setup
└── playwright.config.ts        # Playwright configuration
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests
```bash
npm run test                    # Run once
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage report
```

### Integration Tests
```bash
npm run test:ci                # CI mode with coverage
```

### E2E Tests
```bash
npm run test:e2e               # Headless mode
npm run test:e2e:headed        # With browser UI
npm run test:e2e:ui            # Playwright UI mode
```

### Type Checking
```bash
npm run typecheck
```

## Test Database Setup

The project uses a separate SQLite database for testing:

1. **Test Schema**: `prisma/schema.test.prisma`
2. **Test Database**: Generated at `prisma/test.db`
3. **Test Client**: Generated in `src/generated/test-client`

### Test Database Management

```bash
# Setup test database (run automatically before tests)
npx prisma generate --schema=./prisma/schema.test.prisma
npx prisma db push --schema=./prisma/schema.test.prisma --force-reset
```

## Test Categories

### 1. Business Logic Tests (`src/lib/__tests__/`)

**Scheduling Algorithm (`scheduling-algorithm.test.ts`)**
- Tests the core scheduling optimization logic
- Covers single-day and multi-day event scenarios
- Validates time slot overlapping and scoring
- Tests edge cases and error handling

Key test scenarios:
- ✅ Optimal time finding for all participant availability
- ✅ Handling overlapping availability windows
- ✅ Preferred time filtering and scoring
- ✅ Multi-day event period evaluation
- ✅ Duration parsing and validation
- ✅ Score calculation with bonuses (weekends, round hours)
- ✅ Edge cases (empty participants, no availability)

### 2. Schema Validation Tests (`src/types/__tests__/`)

**Event Form Validation (`event.test.ts`)**
- Tests Zod schema validation for event creation
- Covers both single-day and multi-day event types
- Validates participant data and constraints

Key test scenarios:
- ✅ Valid single-day and multi-day event validation
- ✅ Name length constraints (3-100 characters)
- ✅ Description length limits (500 characters)
- ✅ Date validation (end date after start date)
- ✅ Event type specific field requirements
- ✅ Participant validation (name, email format)
- ✅ Schema refinement logic

### 3. API Integration Tests (`src/app/api/__tests__/`)

**Event Creation API (`events.test.ts`)**
- Tests the POST `/api/events` endpoint
- Validates authentication, data processing, and database operations
- Tests email invitation sending

Key test scenarios:
- ✅ Successful single-day and multi-day event creation
- ✅ Authentication validation (401 responses)
- ✅ Request validation (400 responses)
- ✅ Database transaction integrity
- ✅ Email service integration
- ✅ Error handling (validation, database errors)

**Availability Submission API (`availability.test.ts`)**
- Tests the POST `/api/availability` endpoint
- Validates participant token verification and time slot storage

Key test scenarios:
- ✅ Successful availability submission
- ✅ Time slot replacement for resubmissions
- ✅ Participant token validation
- ✅ Date parsing and storage
- ✅ Error handling for invalid data

### 4. Component Tests (`src/components/__tests__/`)

**Event Form Component (`EventForm.test.tsx`)**
- Tests the main event creation form
- Validates user interactions and form behavior
- Tests conditional field rendering and validation

Key test scenarios:
- ✅ Form rendering with required fields
- ✅ Conditional field display (single-day vs multi-day)
- ✅ Participant management (add/remove)
- ✅ Form validation and error display
- ✅ Successful form submission
- ✅ API error handling
- ✅ Loading states

### 5. End-to-End Tests (`e2e/`)

**Event Creation Flow (`event-creation.spec.ts`)**
- Tests complete user workflows
- Validates cross-browser compatibility
- Tests mobile responsiveness

Key test scenarios:
- ✅ Complete single-day event creation
- ✅ Complete multi-day event creation
- ✅ Form validation and error handling
- ✅ Conditional field behavior
- ✅ Participant management
- ✅ Mobile responsiveness
- ✅ Availability response workflow

## Coverage Configuration

The Jest configuration targets the following coverage thresholds:

```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

### Coverage Exclusions

The following files are excluded from coverage:
- Generated files (`src/generated/`)
- Next.js app structure files (`layout.tsx`, `page.tsx`)
- Style files (`globals.css`)
- Build configuration files

## Mocking Strategy

### External Services
- **Neon Auth**: Mocked in `jest.setup.js`
- **Email Service**: Mocked for unit/integration tests
- **Database**: Separate test database with cleanup between tests
- **Next.js Router**: Mocked for component tests

### Environment Variables
Test environment variables are configured in `jest.setup.js`:
```javascript
process.env = {
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db',
  NEXTAUTH_SECRET: 'test-secret',
  // ... other test env vars
}
```

## Continuous Integration

The test suite runs automatically on:
- Push to `main` and `develop` branches
- Pull requests to `main`

CI pipeline includes:
1. Type checking (`npm run typecheck`)
2. Linting (`npm run lint`)
3. Unit and integration tests with coverage
4. E2E tests with Playwright
5. Coverage report upload to Codecov

## Test Data Management

### Test Utilities (`src/lib/test-setup.ts`)

The `TestDatabaseManager` class provides:
- Database setup and teardown
- Data cleanup between tests
- Mock data generators
- Test database operations

Example usage:
```typescript
beforeAll(async () => {
  await TestDatabaseManager.setupDatabase()
})

beforeEach(async () => {
  await TestDatabaseManager.cleanDatabase()
})

afterAll(async () => {
  await TestDatabaseManager.teardownDatabase()
})
```

## Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- E2E tests: `*.spec.ts`

### Test Organization
- Group related tests with `describe()` blocks
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert

### Example Test Structure
```typescript
describe('Feature Name', () => {
  describe('specific functionality', () => {
    it('should behave correctly when condition is met', () => {
      // Arrange
      const input = createTestData()
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toEqual(expectedOutput)
    })
  })
})
```

## Debugging Tests

### Jest Debugging
```bash
# Run specific test file
npm test -- scheduling-algorithm.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should find optimal time"

# Run with verbose output
npm test -- --verbose
```

### Playwright Debugging
```bash
# Run with browser UI
npm run test:e2e:headed

# Run with Playwright inspector
npm run test:e2e:ui

# Debug specific test
npx playwright test event-creation.spec.ts --debug
```

## Performance Considerations

- Database cleanup is optimized to only delete test data
- Parallel test execution is configured for faster CI runs
- Mock heavy external dependencies to improve test speed
- Use `beforeAll`/`afterAll` for expensive setup operations

## Maintenance

### Regular Tasks
- Update test snapshots when UI changes
- Review and update coverage thresholds quarterly
- Update E2E tests when user flows change
- Monitor test execution time and optimize slow tests

### Test Dependencies
- Keep testing libraries updated
- Review mock implementations for accuracy
- Validate test database schema matches production