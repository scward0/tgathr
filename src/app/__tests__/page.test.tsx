import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../page'

// Mock Next.js router and Link
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn()
  })
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock Stack authentication
const mockSignOut = jest.fn()
const mockUser = {
  id: 'user-123',
  displayName: 'Test User',
  primaryEmail: 'test@example.com',
  signOut: mockSignOut
}

jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Import useUser after mocking
import { useUser } from '@stackframe/stack'

describe('Event Dashboard (Home Page)', () => {
  const user = userEvent.setup()

  // Mock event data
  const mockEvents = [
    {
      id: 'event-1',
      name: 'Active Event High Response',
      description: 'High response rate event',
      eventType: 'single-day',
      availabilityStartDate: '2024-01-15',
      availabilityEndDate: '2024-01-20',
      isFinalized: false,
      participantCount: 10,
      respondedParticipants: 9, // 90% - green
      allResponded: false,
      createdAt: '2024-01-10T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z' // Not expired
    },
    {
      id: 'event-2',
      name: 'Active Event Medium Response',
      description: 'Medium response rate event',
      eventType: 'multi-day',
      availabilityStartDate: '2024-01-15',
      availabilityEndDate: '2024-01-25',
      isFinalized: false,
      participantCount: 10,
      respondedParticipants: 5, // 50% - yellow
      allResponded: false,
      createdAt: '2024-01-11T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z' // Not expired
    },
    {
      id: 'event-3',
      name: 'Active Event Low Response',
      description: 'Low response rate event',
      eventType: 'single-day',
      availabilityStartDate: '2024-01-15',
      availabilityEndDate: '2024-01-20',
      isFinalized: false,
      participantCount: 10,
      respondedParticipants: 2, // 20% - red
      allResponded: false,
      createdAt: '2024-01-12T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z' // Not expired
    },
    {
      id: 'event-4',
      name: 'Finalized Event',
      description: 'This event is finalized',
      eventType: 'multi-day',
      availabilityStartDate: '2024-01-01',
      availabilityEndDate: '2024-01-10',
      isFinalized: true,
      participantCount: 8,
      respondedParticipants: 8, // 100%
      allResponded: true,
      createdAt: '2024-01-01T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z'
    },
    {
      id: 'event-5',
      name: 'Expired Event',
      description: 'This event has expired',
      eventType: 'single-day',
      availabilityStartDate: '2023-12-01',
      availabilityEndDate: '2023-12-10',
      isFinalized: false,
      participantCount: 5,
      respondedParticipants: 3,
      allResponded: false,
      createdAt: '2023-12-01T10:00:00Z',
      expiresAt: '2023-12-31T23:59:59Z' // Expired
    },
    {
      id: 'event-6',
      name: 'Another Active Event',
      description: 'For sorting tests',
      eventType: 'single-day',
      availabilityStartDate: '2024-01-15',
      availabilityEndDate: '2024-01-20',
      isFinalized: false,
      participantCount: 10,
      respondedParticipants: 7, // 70% - yellow/green boundary
      allResponded: false,
      createdAt: '2024-01-09T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue(mockUser)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: mockEvents })
    })
  })

  describe('Authentication States', () => {
    it('shows loading state when user is undefined', () => {
      ;(useUser as jest.Mock).mockReturnValue(undefined)
      render(<Home />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows landing page with sign in/up buttons when not authenticated', () => {
      ;(useUser as jest.Mock).mockReturnValue(null)
      render(<Home />)

      expect(screen.getByText(/tgathr/i)).toBeInTheDocument()
      expect(screen.getByText(/group coordination made simple/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    it('shows dashboard when authenticated', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getAllByText(/welcome, test user!/i)[0]).toBeInTheDocument()
      })
    })
  })

  describe('Event Display', () => {
    it('renders event cards with all required information', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      // Check that key information is displayed
      expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      expect(screen.getByText('High response rate event')).toBeInTheDocument()

      // Multiple events will have these labels, so use getAllByText
      const participantLabels = screen.getAllByText(/participants:/i)
      expect(participantLabels.length).toBeGreaterThan(0)

      const responseLabels = screen.getAllByText(/responses:/i)
      expect(responseLabels.length).toBeGreaterThan(0)

      // Check that view event link exists
      const viewEventLinks = screen.getAllByRole('link', { name: /view event/i })
      expect(viewEventLinks.length).toBeGreaterThan(0)
    })

    it('shows empty state when no events exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/you haven't created any events yet/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/create your first event/i)).toBeInTheDocument()
    })

    it('shows loading state while fetching events', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ events: mockEvents })
        }), 100))
      )

      render(<Home />)

      expect(screen.getByText(/loading your events/i)).toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('renders all filter tabs', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Finalized' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Expired' })).toBeInTheDocument()
    })

    it('shows all events by default', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      expect(screen.getByText('Finalized Event')).toBeInTheDocument()
      expect(screen.getByText('Expired Event')).toBeInTheDocument()
    })

    it('filters to show only active events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Active' }))

      // Should show active events
      expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      expect(screen.getByText('Active Event Medium Response')).toBeInTheDocument()
      expect(screen.getByText('Active Event Low Response')).toBeInTheDocument()
      expect(screen.getByText('Another Active Event')).toBeInTheDocument()

      // Should not show finalized or expired events
      expect(screen.queryByText('Finalized Event')).not.toBeInTheDocument()
      expect(screen.queryByText('Expired Event')).not.toBeInTheDocument()
    })

    it('filters to show only finalized events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Finalized' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Finalized' }))

      // Should only show finalized event
      expect(screen.getByText('Finalized Event')).toBeInTheDocument()

      // Should not show non-finalized events
      expect(screen.queryByText('Active Event High Response')).not.toBeInTheDocument()
      expect(screen.queryByText('Expired Event')).not.toBeInTheDocument()
    })

    it('filters to show only expired events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expired' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Expired' }))

      // Should only show expired event
      expect(screen.getByText('Expired Event')).toBeInTheDocument()

      // Should not show non-expired events
      expect(screen.queryByText('Active Event High Response')).not.toBeInTheDocument()
      expect(screen.queryByText('Finalized Event')).not.toBeInTheDocument()
    })

    it('shows active state styling on selected filter', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      })

      const allButton = screen.getByRole('button', { name: 'All' })
      const activeButton = screen.getByRole('button', { name: 'Active' })

      // All should be active by default
      expect(allButton).toHaveClass('bg-blue-600')
      expect(activeButton).toHaveClass('bg-gray-800')

      // Click Active
      await user.click(activeButton)

      // Active should now be active
      expect(activeButton).toHaveClass('bg-blue-600')
      expect(allButton).toHaveClass('bg-gray-800')
    })

    it('shows empty state message when filter returns no results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          events: [mockEvents[0]] // Only one active event
        })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Finalized' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Finalized' }))

      expect(screen.getByText(/no events match the selected filter/i)).toBeInTheDocument()
    })
  })

  describe('Sort Functionality', () => {
    it('renders sort dropdown with all options', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
      })

      const sortSelect = screen.getByLabelText(/sort by/i)
      expect(sortSelect).toHaveValue('date')

      const options = within(sortSelect as HTMLElement).getAllByRole('option')
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveTextContent('Date')
      expect(options[1]).toHaveTextContent('Name')
      expect(options[2]).toHaveTextContent('Status')
    })

    it('sorts events by date (default) - newest first', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      const eventCards = screen.getAllByText(/event/i).filter(el =>
        el.tagName === 'H4'
      )

      // Should be sorted by date descending (newest first)
      expect(eventCards[0]).toHaveTextContent('Active Event Low Response') // 2024-01-12
      expect(eventCards[1]).toHaveTextContent('Active Event Medium Response') // 2024-01-11
      expect(eventCards[2]).toHaveTextContent('Active Event High Response') // 2024-01-10
    })

    it('sorts events by name alphabetically', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/sort by/i), 'name')

      const eventCards = screen.getAllByText(/event/i).filter(el =>
        el.tagName === 'H4'
      )

      // Should be sorted alphabetically
      expect(eventCards[0]).toHaveTextContent('Active Event High Response')
      expect(eventCards[1]).toHaveTextContent('Active Event Low Response')
      expect(eventCards[2]).toHaveTextContent('Active Event Medium Response')
      expect(eventCards[3]).toHaveTextContent('Another Active Event')
    })

    it('sorts events by status - non-finalized first, then by response rate', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/sort by/i), 'status')

      const eventCards = screen.getAllByText(/event/i).filter(el =>
        el.tagName === 'H4'
      )

      // Non-finalized events should come first, sorted by response rate descending
      // Then finalized events
      const nonFinalizedEvents = eventCards.slice(0, 5) // First 5 are non-finalized
      expect(nonFinalizedEvents[0]).toHaveTextContent('Active Event High Response') // 90%
      expect(nonFinalizedEvents[4]).toHaveTextContent('Active Event Low Response') // 20%

      // Finalized event should be last
      expect(eventCards[eventCards.length - 1]).toHaveTextContent('Finalized Event')
    })
  })

  describe('Response Rate Color Coding', () => {
    it('displays green badge for high response rate (>70%)', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Active Event High Response').closest('div')
      expect(eventCard).toBeInTheDocument()

      if (eventCard) {
        const responseBadge = within(eventCard).getByText(/90% responded/)
        expect(responseBadge).toHaveClass('bg-green-900', 'text-green-300')
      }
    })

    it('displays yellow badge for medium response rate (30-70%)', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event Medium Response')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Active Event Medium Response').closest('div')
      expect(eventCard).toBeInTheDocument()

      if (eventCard) {
        const responseBadge = within(eventCard).getByText(/50% responded/)
        expect(responseBadge).toHaveClass('bg-yellow-900', 'text-yellow-300')
      }
    })

    it('displays red badge for low response rate (<30%)', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event Low Response')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Active Event Low Response').closest('div')
      expect(eventCard).toBeInTheDocument()

      if (eventCard) {
        const responseBadge = within(eventCard).getByText(/20% responded/)
        expect(responseBadge).toHaveClass('bg-red-900', 'text-red-300')
      }
    })

    it('displays finalized badge for finalized events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Finalized Event')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Finalized Event').closest('div')
      expect(eventCard).toBeInTheDocument()

      if (eventCard) {
        const finalizedBadge = within(eventCard).getByText('Finalized')
        expect(finalizedBadge).toHaveClass('bg-purple-900', 'text-purple-300')
      }
    })

    it('displays expired badge for expired events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Expired Event')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Expired Event').closest('div')
      expect(eventCard).toBeInTheDocument()

      if (eventCard) {
        const expiredBadge = within(eventCard).getByText('Expired')
        expect(expiredBadge).toHaveClass('bg-gray-700', 'text-gray-300')
      }
    })
  })

  describe('Navigation', () => {
    it('provides link to create new event', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /create event/i })[0]).toBeInTheDocument()
      })

      const createEventLinks = screen.getAllByRole('link', { name: /create event/i })
      expect(createEventLinks[0]).toHaveAttribute('href', '/events/new')
    })

    it('provides links to view individual events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      const viewEventLinks = screen.getAllByRole('link', { name: /view event/i })
      expect(viewEventLinks.length).toBeGreaterThan(0)
      expect(viewEventLinks[0]).toHaveAttribute('href', expect.stringContaining('/events/'))
    })

    it('has sign out button that calls signOut', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /sign out/i }))

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('Refresh Functionality', () => {
    it('has refresh button that refetches events', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })

      // Clear previous fetch calls
      ;(global.fetch as jest.Mock).mockClear()

      await user.click(screen.getByRole('button', { name: /refresh/i }))

      expect(global.fetch).toHaveBeenCalledWith('/api/events/my-events', {
        credentials: 'include'
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('uses responsive grid classes for event cards', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      // Find all elements with grid class
      const grids = document.querySelectorAll('.grid')
      const eventGrid = Array.from(grids).find(el =>
        el.className.includes('md:grid-cols-2') && el.className.includes('lg:grid-cols-3')
      )

      expect(eventGrid).toBeTruthy()
      expect(eventGrid?.className).toContain('sm:grid-cols-1')
      expect(eventGrid?.className).toContain('md:grid-cols-2')
      expect(eventGrid?.className).toContain('lg:grid-cols-3')
    })

    it('uses flex-wrap for filter buttons for mobile', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      })

      const filterContainer = screen.getByRole('button', { name: 'All' }).parentElement
      expect(filterContainer).toHaveClass('flex-wrap')
    })
  })

  describe('Event History - Finalized Events (US-014)', () => {
    const mockFinalizedEvent = {
      id: 'finalized-1',
      name: 'Completed Single Day Event',
      description: 'A completed event',
      eventType: 'single-day',
      availabilityStartDate: '2024-01-01',
      availabilityEndDate: '2024-01-10',
      isFinalized: true,
      finalStartDate: '2024-01-18T14:00:00Z',
      finalEndDate: '2024-01-18T16:00:00Z',
      participantCount: 10,
      respondedParticipants: 8,
      allResponded: false,
      createdAt: '2024-01-01T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      finalizedAt: '2024-01-15T10:00:00Z',
      daysSinceFinalized: 5
    }

    const mockFinalizedMultiDayEvent = {
      id: 'finalized-2',
      name: 'Completed Multi Day Event',
      description: 'A completed multi-day event',
      eventType: 'multi-day',
      availabilityStartDate: '2024-01-01',
      availabilityEndDate: '2024-01-10',
      isFinalized: true,
      finalStartDate: '2024-01-20T00:00:00Z',
      finalEndDate: '2024-01-25T00:00:00Z',
      participantCount: 12,
      respondedParticipants: 12,
      allResponded: true,
      createdAt: '2024-01-01T10:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      finalizedAt: '2024-01-12T10:00:00Z',
      daysSinceFinalized: 10
    }

    beforeEach(() => {
      jest.clearAllMocks()
      ;(useUser as jest.Mock).mockReturnValue(mockUser)
    })

    it('should display finalized badge for completed events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/✅ completed/i)).toBeInTheDocument()
      })
    })

    it('should show final date/time for finalized single-day events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/final date:/i)).toBeInTheDocument()
      })

      // Check that the completed badge is displayed
      expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      expect(screen.getByText(/✅ completed/i)).toBeInTheDocument()
    })

    it('should show date range for finalized multi-day events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedMultiDayEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Multi Day Event')).toBeInTheDocument()
      })

      // Check that final date section is displayed
      expect(screen.getByText(/final date:/i)).toBeInTheDocument()
      expect(screen.getByText(/✅ completed/i)).toBeInTheDocument()
    })

    it('should display days since finalized', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/5 days ago/i)).toBeInTheDocument()
      })
    })

    it('should show participant confirmation summary for finalized events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      })

      expect(screen.getByText(/8\/10 participants confirmed/i)).toBeInTheDocument()
    })

    it('should sort finalized events by finalization date when filter is active', async () => {
      const olderFinalizedEvent = {
        ...mockFinalizedEvent,
        id: 'finalized-old',
        name: 'Older Finalized Event',
        finalizedAt: '2024-01-05T10:00:00Z',
        daysSinceFinalized: 15
      }

      const newerFinalizedEvent = {
        ...mockFinalizedMultiDayEvent,
        id: 'finalized-new',
        name: 'Newer Finalized Event',
        finalizedAt: '2024-01-18T10:00:00Z',
        daysSinceFinalized: 2
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [olderFinalizedEvent, newerFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Finalized' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Finalized' }))

      await waitFor(() => {
        expect(screen.getByText('Newer Finalized Event')).toBeInTheDocument()
      })

      const eventCards = screen.getAllByText(/event/i).filter(el =>
        el.tagName === 'H4'
      )

      // Newer finalized event should come first
      expect(eventCards[0]).toHaveTextContent('Newer Finalized Event')
      expect(eventCards[1]).toHaveTextContent('Older Finalized Event')
    })

    it('should visually distinguish finalized events from active events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent, mockEvents[0]] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
        expect(screen.getByText('Active Event High Response')).toBeInTheDocument()
      })

      // Finalized event should have the completed badge
      expect(screen.getByText(/✅ completed/i)).toBeInTheDocument()

      // Active event should have standard info display (Participants: text)
      // Since there are two events, check that we can find the Participants text
      expect(screen.getByText(/participants:/i)).toBeInTheDocument()
    })

    it('should link to full event details page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      })

      const viewEventLink = screen.getByRole('link', { name: /view event/i })
      expect(viewEventLink).toHaveAttribute('href', '/events/finalized-1')
    })

    it('should maintain responsive design for finalized event cards', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      })

      // The finalized event card should be in the same responsive grid as other events
      const grids = document.querySelectorAll('.grid')
      const eventGrid = Array.from(grids).find(el =>
        el.className.includes('md:grid-cols-2') && el.className.includes('lg:grid-cols-3')
      )

      expect(eventGrid).toBeTruthy()
    })

    it('should handle finalized events without final dates gracefully', async () => {
      const finalizedWithoutDates = {
        ...mockFinalizedEvent,
        finalStartDate: null,
        finalEndDate: null
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [finalizedWithoutDates] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      })

      // Should still show standard event info instead of the completed badge
      expect(screen.getByText(/participants:/i)).toBeInTheDocument()
      expect(screen.queryByText(/✅ completed/i)).not.toBeInTheDocument()
    })

    it('should display relative time correctly for recent finalized events', async () => {
      const todayFinalizedEvent = {
        ...mockFinalizedEvent,
        daysSinceFinalized: 0
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [todayFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/today/i)).toBeInTheDocument()
      })
    })

    it('should display relative time correctly for yesterday finalized events', async () => {
      const yesterdayFinalizedEvent = {
        ...mockFinalizedEvent,
        daysSinceFinalized: 1
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [yesterdayFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/yesterday/i)).toBeInTheDocument()
      })
    })

    it('should display relative time correctly for old finalized events', async () => {
      const oldFinalizedEvent = {
        ...mockFinalizedEvent,
        daysSinceFinalized: 45
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [oldFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/month/i)).toBeInTheDocument()
      })
    })

    it('should use green color scheme for finalized event section', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ events: [mockFinalizedEvent] })
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Completed Single Day Event')).toBeInTheDocument()
      })

      // Check for green color classes on the finalized section
      const completedBadge = screen.getByText(/✅ completed/i)
      expect(completedBadge).toBeInTheDocument()

      // Get the parent div (flex container) and then its parent (the colored background div)
      const flexContainer = completedBadge.closest('div')
      const completedSection = flexContainer?.parentElement
      expect(completedSection).toHaveClass('bg-green-900/20', 'border-green-700')
    })
  })
})
