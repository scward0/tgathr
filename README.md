# tgathr

A modern event scheduling application that simplifies finding optimal meeting times for groups. Built with intelligent scheduling algorithms, real-time availability tracking, and multi-channel notifications.

## Features

### Smart Scheduling
- **Intelligent Algorithm** — Finds optimal meeting times by analyzing participant overlap, time preferences, and scheduling constraints
- **Top 5 Recommendations** — Ranked suggestions with participation counts, availability percentages, and conflict analysis
- **Heatmap Visualization** — Interactive grid showing availability patterns across dates and time periods

### Event Types

**Single-Day Events**
- Meetings, dinners, parties, conferences
- Configurable duration (1-4 hours or all-day)
- Time preferences (morning, afternoon, evening)

**Multi-Day Events**
- Vacations, retreats, trips
- Configurable length (2-7 days)
- Timing preferences (weekends-only, include-weekdays, flexible)

### Participant Experience
- **Self-Registration** — Shareable links for easy participant signup
- **No Account Required** — Participants submit availability without authentication
- **Edit Tokens** — Participants can update their responses anytime
- **Mobile-Optimized** — Responsive design works on all devices

### Notifications
- **Email Invitations** — Event details with direct availability submission links
- **SMS Notifications** — Optional text message updates with A2P 10DLC compliance
- **Calendar Integration** — ICS file attachments for finalized events
- **Confirmation Alerts** — Automatic notifications when events are finalized

### Dashboard & Analytics
- **Response Tracking** — Real-time participant response counts with 30-second auto-refresh
- **Event Filtering** — Filter by status (active, finalized, expired)
- **One-Click Finalization** — Select recommended time and notify all participants instantly
- **Copy-to-Clipboard** — Easy sharing of event links and invitation messages

## Technology Stack

| Category | Technologies |
|----------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (production), SQLite (development) |
| Auth | Stack Auth |
| Email | Nodemailer (Gmail SMTP) |
| SMS | Twilio |
| Testing | Jest, Playwright, Testing Library |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (production) or SQLite (development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/tgathr.git
cd tgathr

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client and set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API endpoints
│   │   ├── events/           # Event CRUD, finalization, cleanup
│   │   ├── availability/     # Availability submission
│   │   ├── participants/     # Participant management
│   │   └── public/           # Public endpoints (no auth)
│   ├── events/               # Event pages (new, dashboard)
│   ├── e/[shareToken]/       # Public event registration
│   ├── p/[editToken]/        # Participant edit page
│   └── respond/[token]/      # Availability form
├── components/               # React components
│   ├── EventForm.tsx         # Event creation
│   ├── AvailabilityForm.tsx  # Availability grid
│   ├── AvailabilityVisualization.tsx  # Heatmap
│   └── Navigation.tsx        # Global nav
├── lib/                      # Business logic
│   ├── services/             # Domain services
│   ├── calendar/             # ICS generation
│   ├── scheduling-algorithm.ts
│   ├── email.ts
│   └── sms.ts
└── types/                    # TypeScript definitions
```

## Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Type checking

# Testing
npm run test         # Run unit tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e     # End-to-end tests
npm run test:all     # All tests
```

## API Endpoints

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Create event |
| GET | `/api/events/my-events` | List user's events |
| GET | `/api/events/[id]` | Event details with recommendations |
| DELETE | `/api/events/[id]` | Delete event |
| POST | `/api/events/[id]/finalize` | Finalize event time |
| DELETE | `/api/events/[id]/participants/[id]` | Remove participant |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/events/[token]/details` | Event info for registration |
| POST | `/api/public/events/[token]/join` | Register as participant |
| GET | `/api/public/events/[token]/calendar` | Download ICS file |
| POST | `/api/availability` | Submit availability |
| GET | `/api/participants/[token]` | Get participant info |

## How It Works

### 1. Create Event
Authenticated users create events with name, dates, type, and preferences.

### 2. Invite Participants
Share the unique event link. Participants register with their name and optional phone number.

### 3. Collect Availability
Participants select available time slots from an interactive grid.

### 4. Get Recommendations
The algorithm analyzes all responses and suggests optimal times ranked by:
- Participant overlap count
- Preference matching
- Duration requirements
- Convenience factors (round hours, weekend preferences)

### 5. Finalize
Creator selects a recommended time. All participants receive confirmation via email (with ICS attachment) and SMS (if opted in).

## Scheduling Algorithm

The core algorithm evaluates time windows using a multi-factor scoring system:

1. **Participant Overlap** — Maximizes attendance
2. **Preference Matching** — Respects time-of-day and duration preferences
3. **Convenience Scoring** — Bonus for round hours, weekend alignment
4. **Date Diversity** — Ensures recommendations span different dates
5. **Timezone Awareness** — Handles distributed teams

Returns top 5 options with detailed reasoning for each recommendation.

## Testing

- **Unit Tests** — Business logic, algorithm edge cases
- **Integration Tests** — API endpoints with database operations
- **Component Tests** — React components with user interactions
- **E2E Tests** — Complete user workflows with Playwright

Target: 85% coverage overall, 100% for scheduling algorithm.

## Compliance

### SMS (A2P 10DLC)
- Explicit opt-in with timestamp tracking
- "STOP to opt out" message included
- Only sends to opted-in participants
- Compliance documentation at `/compliance/sms-consent`

### Data Handling
- Events expire after 30 days
- Automatic cleanup of expired data
- Optional phone/email fields
- Cascade deletion for data integrity

## Deployment

Configured for Vercel deployment:

1. Connect repository to Vercel
2. Configure environment variables
3. Set up PostgreSQL database (Neon recommended)
4. Deploy on push to main

## Academic Context

**Course**: Penn State SWENG 894 - Software Engineering Capstone

Demonstrates advanced software engineering practices:
- Full-stack TypeScript development
- Intelligent scheduling algorithms
- Multi-channel notification systems
- Comprehensive testing strategies
- Production-ready deployment

## License

Academic project - not licensed for commercial use.
