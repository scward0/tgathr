import { render, screen, fireEvent } from '@testing-library/react';
import { AvailabilityForm } from '../AvailabilityForm';

// Mock fetch globally
global.fetch = jest.fn();

describe('AvailabilityForm', () => {
  const mockEvent = {
    id: 'event-123',
    name: 'Team Meeting',
    eventType: 'single-day',
    availabilityStartDate: '2024-01-15T00:00:00Z',
    availabilityEndDate: '2024-01-15T23:59:59Z',
    preferredTime: 'morning',
    duration: '2-hours',
  };

  const mockParticipant = {
    id: 'participant-123',
    name: 'John Doe',
    token: 'test-token-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render time slot options', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    expect(screen.getAllByText('Morning').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Afternoon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Evening').length).toBeGreaterThan(0);
    expect(screen.getAllByText('All Day').length).toBeGreaterThan(0);
  });

  it('should allow selecting morning without selecting all day', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    const morningButtons = screen.getAllByText('Morning');
    const allDayButtons = screen.getAllByText('All Day');

    const morningButton = morningButtons[0];
    const allDayButton = allDayButtons[0];

    // Initially, neither should be selected
    expect(morningButton).toHaveClass('bg-gray-600');
    expect(allDayButton).toHaveClass('bg-gray-600');

    // Click morning
    fireEvent.click(morningButton);

    // Morning should be selected, all day should NOT be selected
    expect(morningButton).toHaveClass('bg-blue-600');
    expect(allDayButton).toHaveClass('bg-gray-600');
  });

  it('should allow selecting all day without selecting morning', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    const morningButtons = screen.getAllByText('Morning');
    const allDayButtons = screen.getAllByText('All Day');

    const morningButton = morningButtons[0];
    const allDayButton = allDayButtons[0];

    // Click all day
    fireEvent.click(allDayButton);

    // All day should be selected, morning should NOT be selected
    expect(allDayButton).toHaveClass('bg-blue-600');
    expect(morningButton).toHaveClass('bg-gray-600');
  });

  it('should allow selecting both morning and all day independently', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    const morningButtons = screen.getAllByText('Morning');
    const allDayButtons = screen.getAllByText('All Day');

    const morningButton = morningButtons[0];
    const allDayButton = allDayButtons[0];

    // Click morning
    fireEvent.click(morningButton);
    expect(morningButton).toHaveClass('bg-blue-600');
    expect(allDayButton).toHaveClass('bg-gray-600');

    // Click all day (both should now be selected)
    fireEvent.click(allDayButton);
    expect(morningButton).toHaveClass('bg-blue-600');
    expect(allDayButton).toHaveClass('bg-blue-600');

    // Click morning again to deselect
    fireEvent.click(morningButton);
    expect(morningButton).toHaveClass('bg-gray-600');
    expect(allDayButton).toHaveClass('bg-blue-600');
  });

  it('should toggle slot selection on click', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    const afternoonButtons = screen.getAllByText('Afternoon');
    const afternoonButton = afternoonButtons[0];

    // Click to select
    fireEvent.click(afternoonButton);
    expect(afternoonButton).toHaveClass('bg-blue-600');

    // Click to deselect
    fireEvent.click(afternoonButton);
    expect(afternoonButton).toHaveClass('bg-gray-600');
  });

  it('should show selected times count', () => {
    render(<AvailabilityForm event={mockEvent} participant={mockParticipant} />);

    const morningButtons = screen.getAllByText('Morning');
    const afternoonButtons = screen.getAllByText('Afternoon');

    // Select morning
    fireEvent.click(morningButtons[0]);
    expect(screen.getByText(/Selected Times \(1\):/)).toBeInTheDocument();

    // Select afternoon
    fireEvent.click(afternoonButtons[0]);
    expect(screen.getByText(/Selected Times \(2\):/)).toBeInTheDocument();
  });
});
