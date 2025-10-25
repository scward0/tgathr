import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from '../EventForm'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn()
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('EventForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        id: 'test-event-id',
      })
    })
  })

  it('renders the form with required fields', () => {
    render(<EventForm />)

    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument()
    expect(screen.getByText(/event type/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('single-day')).toBeInTheDocument()
    expect(screen.getByDisplayValue('multi-day')).toBeInTheDocument()
    expect(screen.getByLabelText(/availability window start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/availability window end/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })

  it('shows single-day specific fields when single-day is selected', async () => {
    render(<EventForm />)

    // Single-day should be selected by default
    expect(screen.getByDisplayValue('single-day')).toBeChecked()
    
    // Should show single-day specific fields
    expect(screen.getByLabelText(/preferred time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
    
    // Should not show multi-day specific fields
    expect(screen.queryByLabelText(/event length/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/timing preference/i)).not.toBeInTheDocument()
  })

  it('shows multi-day specific fields when multi-day is selected', async () => {
    render(<EventForm />)

    // Switch to multi-day
    await user.click(screen.getByDisplayValue('multi-day'))

    // Should show multi-day specific fields
    expect(screen.getByLabelText(/event length/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/timing preference/i)).toBeInTheDocument()
    
    // Should not show single-day specific fields
    expect(screen.queryByLabelText(/preferred time/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/duration/i)).not.toBeInTheDocument()
  })

  it('shows self-registration info box', () => {
    render(<EventForm />)

    // Should show info about self-registration
    expect(screen.getByText(/self-registration event/i)).toBeInTheDocument()
    expect(screen.getByText(/shareable link/i)).toBeInTheDocument()
  })

  it('validates form and shows error messages', async () => {
    render(<EventForm />)

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByText(/event name must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('requires single-day specific fields for single-day events', async () => {
    render(<EventForm />)

    // Fill in basic required fields but leave single-day fields empty
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByText(/please select preferred time and duration/i)).toBeInTheDocument()
    })
  })

  it('requires multi-day specific fields for multi-day events', async () => {
    render(<EventForm />)

    // Switch to multi-day
    await user.click(screen.getByDisplayValue('multi-day'))

    // Fill in basic required fields but leave multi-day fields empty
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByText(/please select event length and timing preference/i)).toBeInTheDocument()
    })
  })

  it('submits valid single-day event successfully', async () => {
    render(<EventForm />)

    // Fill in all required fields for single-day event
    await user.type(screen.getByLabelText(/event name/i), 'Team Meeting')
    await user.type(screen.getByLabelText(/description/i), 'Weekly team sync')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.selectOptions(screen.getByLabelText(/preferred time/i), 'morning')
    await user.selectOptions(screen.getByLabelText(/duration/i), '2-hours')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Team Meeting',
          description: 'Weekly team sync',
          eventType: 'single-day',
          availabilityStartDate: '2024-01-15T00:00:00.000Z',
          availabilityEndDate: '2024-01-20T00:00:00.000Z',
          preferredTime: 'morning',
          duration: '2-hours',
        })
      })
    })

    // Should navigate on success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/events/test-event-id?created=true')
    })
  })

  it('submits valid multi-day event successfully', async () => {
    render(<EventForm />)

    // Switch to multi-day
    await user.click(screen.getByDisplayValue('multi-day'))

    // Fill in all required fields for multi-day event
    await user.type(screen.getByLabelText(/event name/i), 'Team Retreat')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-30')
    await user.selectOptions(screen.getByLabelText(/event length/i), '3-days')
    await user.selectOptions(screen.getByLabelText(/timing preference/i), 'weekends-only')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Team Retreat',
          description: '',
          eventType: 'multi-day',
          availabilityStartDate: '2024-01-15T00:00:00.000Z',
          availabilityEndDate: '2024-01-30T00:00:00.000Z',
          preferredTime: '',
          duration: '',
          eventLength: '3-days',
          timingPreference: 'weekends-only',
        })
      })
    })
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Validation error',
        details: ['Invalid data']
      })
    })

    render(<EventForm />)

    // Fill in minimal valid data
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.selectOptions(screen.getByLabelText(/preferred time/i), 'morning')
    await user.selectOptions(screen.getByLabelText(/duration/i), '2-hours')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByText(/validation error/i)).toBeInTheDocument()
    })

    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    // Mock delayed API response
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, id: 'test-id' })
      }), 100))
    )

    render(<EventForm />)

    // Fill in minimal valid data
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.selectOptions(screen.getByLabelText(/preferred time/i), 'morning')
    await user.selectOptions(screen.getByLabelText(/duration/i), '2-hours')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    // Should show loading state
    expect(screen.getByText(/creating event/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating event/i })).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })
})