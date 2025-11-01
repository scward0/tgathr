import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityVisualization } from '../AvailabilityVisualization';

describe('AvailabilityVisualization', () => {
  const mockEvent = {
    eventType: 'single-day',
    availabilityStartDate: '2024-01-15',
    availabilityEndDate: '2024-01-17'
  };

  const mockParticipants = [
    {
      id: 'participant-1',
      name: 'Alice Brown',
      hasResponded: true,
      timeSlots: [
        {
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T12:00:00Z'
        },
        {
          startTime: '2024-01-15T13:00:00Z',
          endTime: '2024-01-15T17:00:00Z'
        }
      ]
    },
    {
      id: 'participant-2',
      name: 'Bob Wilson',
      hasResponded: true,
      timeSlots: [
        {
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T12:00:00Z'
        }
      ]
    },
    {
      id: 'participant-3',
      name: 'Charlie Davis',
      hasResponded: true,
      timeSlots: [
        {
          startTime: '2024-01-15T18:00:00Z',
          endTime: '2024-01-15T22:00:00Z'
        }
      ]
    }
  ];

  describe('Rendering', () => {
    it('should render heatmap grid with dates and time periods', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      expect(screen.getByText('Availability Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText('Evening')).toBeInTheDocument();
    });

    it('should render all dates in range', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
    });

    it('should display legend with color gradient', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      expect(screen.getByText('75%+')).toBeInTheDocument();
      expect(screen.getByText('50-75%')).toBeInTheDocument();
      expect(screen.getByText('25-50%')).toBeInTheDocument();
      expect(screen.getByText('<25%')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      expect(screen.getByText('Click on any cell to see who is available')).toBeInTheDocument();
    });
  });

  describe('No data state', () => {
    it('should show empty state when no participants have responded', () => {
      const noResponseParticipants = [
        {
          id: 'participant-1',
          name: 'Alice Brown',
          hasResponded: false,
          timeSlots: []
        }
      ];

      render(<AvailabilityVisualization event={mockEvent} participants={noResponseParticipants} />);

      expect(screen.getByText('No availability data yet. Waiting for participants to respond...')).toBeInTheDocument();
      expect(screen.queryByText('Availability Heatmap')).not.toBeInTheDocument();
    });

    it('should show empty state when participants array is empty', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={[]} />);

      expect(screen.getByText('No availability data yet. Waiting for participants to respond...')).toBeInTheDocument();
    });
  });

  describe('Availability counting', () => {
    it('should display correct availability counts per cell', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Morning on Jan 15 should have 2 available (Alice and Bob)
      const cells = screen.getAllByText('2');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should display correct percentages', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Morning on Jan 15: 2/3 = 67%
      expect(screen.getByText('67%')).toBeInTheDocument();

      // Evening on Jan 15: 1/3 = 33% (may appear multiple times across date range)
      const percentages = screen.getAllByText('33%');
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should show 0 for cells with no availability', () => {
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Most cells should have 0 availability
      const zeroCells = screen.getAllByText('0');
      expect(zeroCells.length).toBeGreaterThan(0);
    });
  });

  describe('Color gradient', () => {
    it('should apply correct color class for high availability (75%+)', () => {
      const highAvailabilityParticipants = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [{ startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' }]
        },
        {
          id: 'p2',
          name: 'Bob',
          hasResponded: true,
          timeSlots: [{ startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' }]
        },
        {
          id: 'p3',
          name: 'Charlie',
          hasResponded: true,
          timeSlots: [{ startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' }]
        },
        {
          id: 'p4',
          name: 'David',
          hasResponded: true,
          timeSlots: [{ startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' }]
        }
      ];

      const { container } = render(
        <AvailabilityVisualization event={mockEvent} participants={highAvailabilityParticipants} />
      );

      // 4/4 = 100% should have bg-blue-500
      const blueCells = container.querySelectorAll('.bg-blue-500');
      expect(blueCells.length).toBeGreaterThan(0);
    });

    it('should apply correct color class for zero availability', () => {
      const { container } = render(
        <AvailabilityVisualization event={mockEvent} participants={mockParticipants} />
      );

      // Cells with 0% should have bg-gray-800
      const grayCells = container.querySelectorAll('.bg-gray-800');
      expect(grayCells.length).toBeGreaterThan(0);
    });
  });

  describe('Cell interaction', () => {
    it('should show participant breakdown when cell is clicked', async () => {
      const user = userEvent.setup();
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Find and click a cell with availability
      const cells = screen.getAllByRole('cell');
      const cellWithData = cells.find(cell => cell.textContent?.includes('2'));

      if (cellWithData) {
        await user.click(cellWithData);

        // Should show breakdown with available participants
        await waitFor(() => {
          expect(screen.getByText(/✓ Available/)).toBeInTheDocument();
        });
      }
    });

    it('should display available participants in breakdown', async () => {
      const user = userEvent.setup();
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Click on morning cell
      const cells = screen.getAllByRole('cell');
      const morningCell = cells.find(cell => {
        const text = cell.textContent || '';
        return text.includes('2') && text.includes('67%');
      });

      if (morningCell) {
        await user.click(morningCell);

        await waitFor(() => {
          expect(screen.getByText('Alice Brown')).toBeInTheDocument();
          expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        });
      }
    });

    it('should display unavailable participants in breakdown', async () => {
      const user = userEvent.setup();
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Click on morning cell
      const cells = screen.getAllByRole('cell');
      const morningCell = cells.find(cell => {
        const text = cell.textContent || '';
        return text.includes('2') && text.includes('67%');
      });

      if (morningCell) {
        await user.click(morningCell);

        await waitFor(() => {
          expect(screen.getByText(/✗ Not Available/)).toBeInTheDocument();
          expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
        });
      }
    });

    it('should close breakdown when cell is clicked again', async () => {
      const user = userEvent.setup();
      render(<AvailabilityVisualization event={mockEvent} participants={mockParticipants} />);

      // Find a cell with data (2 available, 67%)
      const cells = screen.getAllByRole('cell');
      const cellWithData = cells.find(cell => {
        const text = cell.textContent || '';
        return text.includes('2') && text.includes('67%');
      });

      if (cellWithData) {
        // Click to open
        await user.click(cellWithData);
        await waitFor(() => {
          expect(screen.getByText('Alice Brown')).toBeInTheDocument();
          expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        });

        // Click again to close - check that the detail panel header is gone
        await user.click(cellWithData);
        await waitFor(() => {
          expect(screen.queryByText('Monday, January 15, 2024 - Morning')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Multi-day event', () => {
    it('should show "All Day" for multi-day events', () => {
      const multiDayEvent = {
        eventType: 'multi-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-20'
      };

      const participants = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            { startTime: '2024-01-15T00:00:00Z', endTime: '2024-01-15T23:59:59Z' }
          ]
        }
      ];

      render(<AvailabilityVisualization event={multiDayEvent} participants={participants} />);

      expect(screen.getByText('All Day')).toBeInTheDocument();
      expect(screen.queryByText('Morning')).not.toBeInTheDocument();
      expect(screen.queryByText('Afternoon')).not.toBeInTheDocument();
      expect(screen.queryByText('Evening')).not.toBeInTheDocument();
    });

    it('should correctly aggregate multi-day availability', () => {
      const multiDayEvent = {
        eventType: 'multi-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-17'
      };

      const participants = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            { startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T17:00:00Z' },
            { startTime: '2024-01-16T09:00:00Z', endTime: '2024-01-16T17:00:00Z' }
          ]
        },
        {
          id: 'p2',
          name: 'Bob',
          hasResponded: true,
          timeSlots: [
            { startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T17:00:00Z' }
          ]
        }
      ];

      render(<AvailabilityVisualization event={multiDayEvent} participants={participants} />);

      // Jan 15 should have 2 available (both Alice and Bob)
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Jan 16 should have 1 available (only Alice)
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle participants with overlapping time slots', () => {
      const overlappingParticipants = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            { startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' },
            { startTime: '2024-01-15T10:00:00Z', endTime: '2024-01-15T14:00:00Z' }
          ]
        }
      ];

      render(<AvailabilityVisualization event={mockEvent} participants={overlappingParticipants} />);

      // Should only count Alice once per cell (appears in both Morning and Afternoon)
      // Morning cell (9-12): Alice has overlapping slots covering this period
      const percentages = screen.getAllByText('100%');
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should handle ISO string time slot values', () => {
      const participantsWithStrings = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            {
              startTime: '2024-01-15T09:00:00Z',
              endTime: '2024-01-15T12:00:00Z'
            }
          ]
        }
      ];

      render(<AvailabilityVisualization event={mockEvent} participants={participantsWithStrings} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle Date objects for event dates', () => {
      const eventWithDates = {
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15T00:00:00Z'),
        availabilityEndDate: new Date('2024-01-17T00:00:00Z')
      };

      render(<AvailabilityVisualization event={eventWithDates} participants={mockParticipants} />);

      expect(screen.getByText('Availability Heatmap')).toBeInTheDocument();
      // Should still render with Date objects and have availability data
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('should handle single-day date range', () => {
      const singleDayEvent = {
        eventType: 'single-day',
        availabilityStartDate: '2024-01-15',
        availabilityEndDate: '2024-01-15'
      };

      const participants = [
        {
          id: 'p1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            { startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T12:00:00Z' }
          ]
        }
      ];

      render(<AvailabilityVisualization event={singleDayEvent} participants={participants} />);

      expect(screen.getByText('Availability Heatmap')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should render table with horizontal scroll container', () => {
      const { container } = render(
        <AvailabilityVisualization event={mockEvent} participants={mockParticipants} />
      );

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have responsive text sizes', () => {
      const { container } = render(
        <AvailabilityVisualization event={mockEvent} participants={mockParticipants} />
      );

      // Check for responsive classes (md: breakpoints)
      const header = screen.getByText('Availability Heatmap');
      expect(header.className).toContain('md:text-xl');
    });
  });
});
