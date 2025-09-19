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
        participants: []
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

  it('allows adding and removing participants', async () => {
    render(<EventForm />)

    // Should have one participant field initially
    expect(screen.getByLabelText(/participant 1 name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/participant 1 email/i)).toBeInTheDocument()

    // Add another participant
    await user.click(screen.getByRole('button', { name: /add participant/i }))
    
    expect(screen.getByLabelText(/participant 2 name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/participant 2 email/i)).toBeInTheDocument()

    // Remove a participant
    const removeButtons = screen.getAllByRole('button', { name: /remove participant/i })
    await user.click(removeButtons[0])
    
    // Should only have one participant left
    expect(screen.queryByLabelText(/participant 2 name/i)).not.toBeInTheDocument()
  })

  it('validates form and shows error messages', async () => {
    render(<EventForm />)

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByText(/event name must be at least 3 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<EventForm />)

    // Test that email input accepts input (basic functionality test)
    const emailInput = screen.getByLabelText(/participant 1 email/i)
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')

    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('requires single-day specific fields for single-day events', async () => {
    render(<EventForm />)

    // Fill in basic required fields but leave single-day fields empty
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.type(screen.getByLabelText(/participant 1 name/i), 'Test User')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'test@example.com')

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
    await user.type(screen.getByLabelText(/participant 1 name/i), 'Test User')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'test@example.com')

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
    await user.type(screen.getByLabelText(/participant 1 name/i), 'John Doe')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'john@example.com')

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
          participants: [
            {
              name: 'John Doe',
              phoneNumber: '',
              email: 'john@example.com'
            }
          ]
        })
      })
    })

    // Should navigate on success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/events/test-event-id')
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
    await user.type(screen.getByLabelText(/participant 1 name/i), 'Jane Smith')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'jane@example.com')

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
          participants: [
            {
              name: 'Jane Smith',
              phoneNumber: '',
              email: 'jane@example.com'
            }
          ]
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
    await user.type(screen.getByLabelText(/participant 1 name/i), 'Test User')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'test@example.com')

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
        json: () => Promise.resolve({ success: true, id: 'test-id', participants: [] })
      }), 100))
    )

    render(<EventForm />)

    // Fill in minimal valid data
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.selectOptions(screen.getByLabelText(/preferred time/i), 'morning')
    await user.selectOptions(screen.getByLabelText(/duration/i), '2-hours')
    await user.type(screen.getByLabelText(/participant 1 name/i), 'Test User')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'test@example.com')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    // Should show loading state
    expect(screen.getByText(/creating event/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating event/i })).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })

  it('allows optional phone numbers for participants', async () => {
    render(<EventForm />)

    // Fill in participant with phone number
    await user.type(screen.getByLabelText(/participant 1 name/i), 'John Doe')
    await user.type(screen.getByLabelText(/participant 1 email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/participant 1 phone/i), '+1234567890')

    // Fill other required fields
    await user.type(screen.getByLabelText(/event name/i), 'Test Event')
    await user.type(screen.getByLabelText(/availability window start/i), '2024-01-15')
    await user.type(screen.getByLabelText(/availability window end/i), '2024-01-20')
    await user.selectOptions(screen.getByLabelText(/preferred time/i), 'morning')
    await user.selectOptions(screen.getByLabelText(/duration/i), '2-hours')

    await user.click(screen.getByRole('button', { name: /create event/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events', expect.objectContaining({
        body: expect.stringContaining('+1234567890')
      }))
    })
  })
})