# tgathr

A modern event scheduling application that simplifies the process of finding optimal meeting times for groups. Built as a Penn State SWENG 894 capstone project demonstrating advanced scheduling algorithms and modern web development practices.

## Overview

tgathr helps users create events and collect availability from participants to automatically find the best meeting times. The application supports both single-day meetings and multi-day events with intelligent scheduling optimization.

### Key Features

- **Event Creation**: Create single-day meetings or multi-day events with customizable parameters
- **Smart Scheduling**: Advanced algorithm finds optimal times based on participant availability
- **Multiple Communication Channels**: Email and SMS notifications for participants
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Availability Collection**: Participants can submit their availability through personalized links
- **Automatic Optimization**: Considers preferred times, duration requirements, and participant constraints

### Event Types

**Single-Day Events**
- Meetings, dinners, parties
- Configurable duration (1-4 hours or all-day)
- Preferred time slots (morning, afternoon, evening)

**Multi-Day Events**
- Vacations, trips, retreats
- Configurable length (2-7 days)
- Timing preferences (weekdays, weekends, any)

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (production), SQLite (development/testing)
- **Authentication**: Stack Auth (Neon integration)
- **Communication**: Nodemailer (email), Twilio (SMS)
- **Testing**: Jest, Playwright, Testing Library
- **Deployment**: Vercel

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   ├── components/             # Reusable React components
│   ├── lib/                    # Business logic and utilities
│   ├── types/                  # TypeScript type definitions
│   └── generated/              # Generated Prisma client
├── prisma/                     # Database schema and migrations
├── e2e/                        # End-to-end tests
└── docs/                       # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL (for production) or SQLite (for development)
- Environment variables (see `.env.example`)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd tgathr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

### Development
- `npm run dev` - Start development server with database generation
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit and integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:all` - Run all tests (unit + E2E)

### Database
- `npm run test:db:setup` - Set up test database

## Core Algorithm

The scheduling algorithm implements a sophisticated scoring system that:

1. **Evaluates Time Windows**: Finds all possible time slots within the availability window
2. **Calculates Participant Overlap**: Determines how many participants are available for each slot
3. **Applies Preference Scoring**: Prioritizes preferred times and durations
4. **Optimizes for Convenience**: Considers factors like round hours and weekend preferences
5. **Ranks Options**: Returns the best options sorted by score

The algorithm supports both single-day meetings (finding optimal time slots) and multi-day events (finding optimal date ranges).

## API Endpoints

### Events
- `POST /api/events` - Create new event
- `GET /api/events/my-events` - Get user's events
- `GET /api/events/[id]` - Get event details
- `POST /api/events/[id]/finalize` - Finalize event time

### Availability
- `POST /api/availability` - Submit participant availability
- `GET /api/participants/[token]` - Get participant information

## Database Schema

The application uses Prisma ORM with the following main entities:

- **Event**: Core event information and settings
- **Participant**: Event participants and their details
- **TimeSlot**: Individual availability submissions
- **User**: Application users (authenticated)

## Authentication

Integration with Stack Auth provides:
- User registration and login
- Session management
- Protected API routes
- User profile management

## Communication

**Email Notifications**
- Event invitations with availability links
- Event finalization notifications
- Powered by Nodemailer with SMTP configuration

**SMS Notifications** (Optional)
- Availability reminders
- Event updates
- Powered by Twilio

## Testing Strategy

Comprehensive test coverage includes:
- **Unit Tests**: Business logic and utilities (Jest)
- **Integration Tests**: API endpoints with database operations
- **Component Tests**: React components with user interactions
- **End-to-End Tests**: Complete user workflows (Playwright)

Target coverage: 85% overall, 100% for critical scheduling algorithm.

See [testing.md](./testing.md) for detailed testing documentation.

## Deployment

The application is configured for deployment on Vercel:

1. Connect repository to Vercel
2. Configure environment variables
3. Set up PostgreSQL database (recommend Neon)
4. Deploy automatically on push to main branch

## Performance Considerations

- **Database Optimization**: Efficient queries with Prisma
- **Caching Strategy**: Optimized API responses
- **Bundle Optimization**: Tree-shaking and code splitting
- **Image Optimization**: Next.js automatic optimization

## Security

- **Input Validation**: Comprehensive schema validation with Zod
- **Authentication**: Secure session management
- **API Protection**: Route-level authentication
- **Data Sanitization**: SQL injection prevention with Prisma

## Contributing

This is an academic capstone project. For development:

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting changes

## Academic Context

**Course**: Penn State SWENG 894 - Software Engineering Capstone
**Focus**: Advanced algorithms, modern web development, testing strategies
**Key Learning Objectives**: Full-stack development, database design, algorithm implementation, comprehensive testing

## License

This project is part of an academic assignment and is not licensed for commercial use.

## Support

For questions about the implementation or academic aspects of this project, please refer to the documentation in the `docs/` directory or contact the development team.