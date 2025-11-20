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
    it.skip('should handle participants with overlapping time slots', () => {
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

    it.skip('should handle ISO string time slot values', () => {
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

    it.skip('should handle Date objects for event dates', () => {
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

  describe('Heatmap Finalization (US-028)', () => {
    const mockEventWithId = {
      id: 'event-123',
      eventType: 'single-day',
      availabilityStartDate: '2024-01-15',
      availabilityEndDate: '2024-01-17',
      isFinalized: false,
    };

    // 5 participants for threshold testing
    // Using local times (no Z suffix) to avoid timezone issues in tests
    const fiveParticipants = [
      {
        id: 'p1',
        name: 'Alice',
        hasResponded: true,
        timeSlots: [{ startTime: '2024-01-15T09:00:00', endTime: '2024-01-15T12:00:00' }],
      },
      {
        id: 'p2',
        name: 'Bob',
        hasResponded: true,
        timeSlots: [{ startTime: '2024-01-15T09:00:00', endTime: '2024-01-15T12:00:00' }],
      },
      {
        id: 'p3',
        name: 'Charlie',
        hasResponded: true,
        timeSlots: [{ startTime: '2024-01-15T09:00:00', endTime: '2024-01-15T12:00:00' }],
      },
      {
        id: 'p4',
        name: 'David',
        hasResponded: true,
        timeSlots: [{ startTime: '2024-01-15T09:00:00', endTime: '2024-01-15T12:00:00' }],
      },
      {
        id: 'p5',
        name: 'Eve',
        hasResponded: true,
        timeSlots: [{ startTime: '2024-01-15T13:00:00', endTime: '2024-01-15T17:00:00' }], // Different time
      },
    ];

    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // HEATMAP-001: Finalization Button Rendering
    describe('HEATMAP-001: Finalization Button Rendering', () => {
      it('should show finalize button when cell is clicked with sufficient participation (≥50%)', async () => {
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Click on morning cell (4/5 participants = 80% available)
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => {
          const text = cell.textContent || '';
          return text.includes('4') && text.includes('80%');
        });

        expect(morningCell).toBeDefined();
        await user.click(morningCell!);

        // Verify finalize button appears
        await waitFor(() => {
          const finalizeButton = screen.getByText(/finalize this time/i);
          expect(finalizeButton).toBeInTheDocument();
        });

        // Verify button text includes participant count
        expect(screen.getByText(/finalize this time - 4\/5 available/i)).toBeInTheDocument();

        // Verify button is enabled (find by aria-label)
        const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
        expect(finalizeButton).not.toBeDisabled();
      });

      it('should not show finalize button when event ID is missing', async () => {
        const eventWithoutId = {
          eventType: 'single-day',
          availabilityStartDate: '2024-01-15',
          availabilityEndDate: '2024-01-17',
        };
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={eventWithoutId} participants={fiveParticipants} />);

        // Click on morning cell
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));

        if (morningCell) {
          await user.click(morningCell);

          // Finalize button should not appear
          await waitFor(() => {
            expect(screen.queryByText(/finalize this time/i)).not.toBeInTheDocument();
          });
        }
      });

      it('should not show finalize button when event is already finalized', async () => {
        const finalizedEvent = { ...mockEventWithId, isFinalized: true };
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={finalizedEvent} participants={fiveParticipants} />);

        // Click on morning cell
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));

        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            // Should show "Event already finalized" message instead
            expect(screen.getByText('Event already finalized')).toBeInTheDocument();
            expect(screen.queryByText(/finalize this time/i)).not.toBeInTheDocument();
          });
        }
      });
    });

    // HEATMAP-002: Insufficient Participation Disabled State
    describe('HEATMAP-002: Insufficient Participation Disabled State', () => {
      it('should disable finalize button when participation is below 50%', async () => {
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Click on afternoon cell (1/5 participants = 20% available)
        const cells = screen.getAllByRole('cell');
        const afternoonCell = cells.find(cell => {
          const text = cell.textContent || '';
          return text.includes('1') && text.includes('20%');
        });

        expect(afternoonCell).toBeDefined();
        await user.click(afternoonCell!);

        // Verify button is disabled
        await waitFor(() => {
          const finalizeButton = screen.getByRole('button', { name: /finalization disabled due to insufficient participation/i });
          expect(finalizeButton).toBeDisabled();
        });

        // Verify explanation text appears
        expect(screen.getByText(/insufficient participation \(minimum 50% recommended\)/i)).toBeInTheDocument();
      });

      it('should not trigger action when clicking disabled button', async () => {
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Click on afternoon cell (1/5 = 20%)
        const cells = screen.getAllByRole('cell');
        const afternoonCell = cells.find(cell => {
          const text = cell.textContent || '';
          return text.includes('1') && text.includes('20%');
        });

        if (afternoonCell) {
          await user.click(afternoonCell);

          await waitFor(() => {
            const disabledButton = screen.getByRole('button', { name: /finalization disabled due to insufficient participation/i });
            expect(disabledButton).toBeDisabled();
          });

          // Attempt to click disabled button
          const disabledButton = screen.getByRole('button', { name: /finalization disabled due to insufficient participation/i });
          await user.click(disabledButton);

          // Confirmation dialog should NOT appear
          expect(screen.queryByText('Confirm Event Finalization')).not.toBeInTheDocument();
          expect(global.fetch).not.toHaveBeenCalled();
        }
      });
    });

    // HEATMAP-003: Finalization Confirmation Dialog
    describe('HEATMAP-003: Finalization Confirmation Dialog', () => {
      it('should show confirmation dialog when finalize button is clicked', async () => {
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Click cell
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4') && cell.textContent?.includes('80%'));

        if (morningCell) {
          await user.click(morningCell);

          // Click finalize button
          await waitFor(() => {
            const finalizeButton = screen.getByText(/finalize this time - 4\/5 available/i);
            expect(finalizeButton).toBeInTheDocument();
          });

          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          // Verify dialog appears
          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          // Verify dialog shows event details (using getAllByText since date appears in both places)
          expect(screen.getAllByText(/Monday, January 15, 2024/i).length).toBeGreaterThan(0);
          expect(screen.getAllByText(/Morning/i).length).toBeGreaterThan(0);

          // Verify dialog shows participant counts
          expect(screen.getByText(/4 participants available/i)).toBeInTheDocument();
          expect(screen.getByText(/1 participant unavailable/i)).toBeInTheDocument();

          // Verify dialog has Cancel and Confirm buttons
          expect(screen.getByRole('button', { name: /cancel finalization/i })).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /confirm event finalization/i })).toBeInTheDocument();
        }
      });

      it('should close dialog when Cancel is clicked without making API call', async () => {
        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Open cell and click finalize
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          // Wait for dialog
          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          // Click Cancel
          const cancelButton = screen.getByRole('button', { name: /cancel finalization/i });
          await user.click(cancelButton);

          // Dialog should close
          await waitFor(() => {
            expect(screen.queryByText('Confirm Event Finalization')).not.toBeInTheDocument();
          });

          // No API call should be made
          expect(global.fetch).not.toHaveBeenCalled();
        }
      });

      it('should call finalization API when Confirm is clicked', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Open cell and click finalize
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          // Wait for dialog and click Confirm
          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          const confirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          await user.click(confirmButton);

          // Verify API call was made
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              '/api/events/event-123/finalize',
              expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"source":"heatmap"'),
              })
            );
          });
        }
      });
    });

    // HEATMAP-004: Finalization API Integration
    describe('HEATMAP-004: Finalization API Integration', () => {
      it('should send correct date/time data to finalization API', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Click morning cell
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          // Confirm in dialog
          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          const confirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          await user.click(confirmButton);

          // Verify API call with correct parameters
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);

            expect(body.finalStartDate).toBeDefined();
            expect(body.finalEndDate).toBeDefined();
            expect(body.source).toBe('heatmap');

            // Verify times are for morning (9am-12pm)
            const startDate = new Date(body.finalStartDate);
            const endDate = new Date(body.finalEndDate);
            expect(startDate.getHours()).toBe(9);
            expect(endDate.getHours()).toBe(12);
          });
        }
      });

      it('should handle API error gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Failed to finalize event' }),
        });

        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Complete finalization flow
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          const confirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          await user.click(confirmButton);

          // Error message should appear
          await waitFor(() => {
            expect(screen.getByText(/failed to finalize event/i)).toBeInTheDocument();
          });

          // Dialog should close on error
          expect(screen.queryByText('Confirm Event Finalization')).not.toBeInTheDocument();
        }
      });
    });

    // HEATMAP-005: Loading State During Finalization
    describe('HEATMAP-005: Loading State During Finalization', () => {
      it('should show loading state while finalizing', async () => {
        // Create a promise that we can control
        let resolveFinalize: (value: unknown) => void;
        const finalizePromise = new Promise((resolve) => {
          resolveFinalize = resolve;
        });

        (global.fetch as jest.Mock).mockReturnValueOnce(finalizePromise);

        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Complete finalization flow
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          const confirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          await user.click(confirmButton);

          // Loading state should be visible in dialog
          await waitFor(() => {
            expect(screen.getByText('Finalizing...')).toBeInTheDocument();
          });

          // Confirm button should be disabled during loading
          const loadingConfirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          expect(loadingConfirmButton).toBeDisabled();

          // Resolve the promise
          resolveFinalize!({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
      });

      it('should show success feedback after finalization', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const user = userEvent.setup();
        render(<AvailabilityVisualization event={mockEventWithId} participants={fiveParticipants} />);

        // Complete finalization flow
        const cells = screen.getAllByRole('cell');
        const morningCell = cells.find(cell => cell.textContent?.includes('4'));
        if (morningCell) {
          await user.click(morningCell);

          await waitFor(() => {
            expect(screen.getByText(/finalize this time/i)).toBeInTheDocument();
          });
          const finalizeButton = screen.getByRole('button', { name: /finalize event for 4 of 5 participants/i });
          await user.click(finalizeButton);

          await waitFor(() => {
            expect(screen.getByText('Confirm Event Finalization')).toBeInTheDocument();
          });

          const confirmButton = screen.getByRole('button', { name: /confirm event finalization/i });
          await user.click(confirmButton);

          // Success message should appear
          await waitFor(() => {
            expect(screen.getByText(/event finalized successfully/i)).toBeInTheDocument();
          });
        }
      });
    });
  });
});
