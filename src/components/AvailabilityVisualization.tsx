'use client';

import { useState } from 'react';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface TimeSlot {
  startTime: string | Date;
  endTime: string | Date;
  participantId?: string;
  participantName?: string;
}

interface Participant {
  id: string;
  name: string;
  hasResponded: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilityVisualizationProps {
  event: {
    eventType: string;
    availabilityStartDate: string | Date;
    availabilityEndDate: string | Date;
  };
  participants: Participant[];
}

interface TimeSlotGroup {
  label: string;
  startHour: number;
  endHour: number;
}

export function AvailabilityVisualization({ event, participants }: AvailabilityVisualizationProps) {
  const [selectedCell, setSelectedCell] = useState<{ date: Date; slotIndex: number } | null>(null);

  // Define time periods
  const timeSlots: TimeSlotGroup[] = event.eventType === 'single-day'
    ? [
        { label: 'Morning', startHour: 9, endHour: 12 },
        { label: 'Afternoon', startHour: 13, endHour: 17 },
        { label: 'Evening', startHour: 18, endHour: 22 },
      ]
    : [
        { label: 'All Day', startHour: 0, endHour: 24 },
      ];

  // Get all dates in range
  const startDate = typeof event.availabilityStartDate === 'string'
    ? parseISO(event.availabilityStartDate)
    : event.availabilityStartDate;
  const endDate = typeof event.availabilityEndDate === 'string'
    ? parseISO(event.availabilityEndDate)
    : event.availabilityEndDate;

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Get respondents only
  const respondedParticipants = participants.filter(p => p.hasResponded);
  const totalRespondents = respondedParticipants.length;

  // Function to check if a time slot overlaps with a time period
  const isTimeSlotInPeriod = (slot: TimeSlot, periodStart: number, periodEnd: number): boolean => {
    const slotStart = typeof slot.startTime === 'string' ? parseISO(slot.startTime) : slot.startTime;
    const slotEnd = typeof slot.endTime === 'string' ? parseISO(slot.endTime) : slot.endTime;

    const slotStartHour = slotStart.getHours();
    const slotEndHour = slotEnd.getHours();

    // For multi-day (all day), any time slot counts
    if (periodStart === 0 && periodEnd === 24) {
      return true;
    }

    // Check if there's any overlap between the slot and the period
    return (slotStartHour < periodEnd && slotEndHour > periodStart) ||
           (slotStartHour >= periodStart && slotStartHour < periodEnd) ||
           (slotEndHour > periodStart && slotEndHour <= periodEnd);
  };

  // Get availability data for a specific date and time period
  const getAvailabilityForCell = (date: Date, timeSlot: TimeSlotGroup) => {
    const available: Participant[] = [];

    for (const participant of respondedParticipants) {
      for (const slot of participant.timeSlots) {
        const slotDate = typeof slot.startTime === 'string' ? parseISO(slot.startTime) : slot.startTime;

        if (isSameDay(slotDate, date) && isTimeSlotInPeriod(slot, timeSlot.startHour, timeSlot.endHour)) {
          available.push(participant);
          break; // Only count each participant once per cell
        }
      }
    }

    return available;
  };

  // Get color intensity based on availability percentage
  const getColorIntensity = (availableCount: number): string => {
    if (totalRespondents === 0) {
      return 'bg-gray-800';
    }

    const percentage = availableCount / totalRespondents;

    if (percentage === 0) {
      return 'bg-gray-800';
    }
    if (percentage < 0.25) {
      return 'bg-blue-900/40';
    }
    if (percentage < 0.5) {
      return 'bg-blue-700/60';
    }
    if (percentage < 0.75) {
      return 'bg-blue-600/80';
    }
    return 'bg-blue-500';
  };

  // Get text color based on intensity
  const getTextColor = (availableCount: number): string => {
    if (totalRespondents === 0) {
      return 'text-gray-500';
    }
    const percentage = availableCount / totalRespondents;
    return percentage >= 0.5 ? 'text-white font-semibold' : 'text-gray-300';
  };

  if (totalRespondents === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No availability data yet. Waiting for participants to respond...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Availability Heatmap</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-300">75%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600/80 rounded"></div>
            <span className="text-gray-300">50-75%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-700/60 rounded"></div>
            <span className="text-gray-300">25-50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-900/40 rounded"></div>
            <span className="text-gray-300">&lt;25%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div>
            <span className="text-gray-300">None</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-700 bg-gray-900 p-3 text-left text-sm font-semibold text-gray-300 sticky left-0 z-10">
                  Date
                </th>
                {timeSlots.map((slot, idx) => (
                  <th key={idx} className="border border-gray-700 bg-gray-900 p-3 text-center text-sm font-semibold text-gray-300 min-w-[120px]">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dateRange.map((date, dateIdx) => (
                <tr key={dateIdx} className="hover:bg-gray-700/20 transition-colors">
                  <td className="border border-gray-700 bg-gray-900 p-3 text-sm text-white font-medium sticky left-0 z-10">
                    <div>{format(date, 'EEE')}</div>
                    <div className="text-gray-400 text-xs">{format(date, 'MMM d')}</div>
                  </td>
                  {timeSlots.map((slot, slotIdx) => {
                    const available = getAvailabilityForCell(date, slot);
                    const isSelected = selectedCell?.date === date && selectedCell?.slotIndex === slotIdx;

                    return (
                      <td
                        key={slotIdx}
                        className={`border border-gray-700 p-3 text-center cursor-pointer transition-all ${getColorIntensity(available.length)} ${
                          isSelected ? 'ring-2 ring-yellow-400' : ''
                        }`}
                        onClick={() => setSelectedCell(isSelected ? null : { date, slotIndex: slotIdx })}
                        title={`${available.length}/${totalRespondents} available`}
                      >
                        <div className={`text-lg font-bold ${getTextColor(available.length)}`}>
                          {available.length}
                        </div>
                        <div className="text-xs text-gray-400">
                          {Math.round((available.length / totalRespondents) * 100)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-3">
            {format(selectedCell.date, 'EEEE, MMMM d, yyyy')} - {timeSlots[selectedCell.slotIndex].label}
          </h3>
          <div className="space-y-2">
            {(() => {
              const available = getAvailabilityForCell(selectedCell.date, timeSlots[selectedCell.slotIndex]);
              const unavailable = respondedParticipants.filter(p => !available.includes(p));

              return (
                <>
                  {available.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-green-400 mb-1">
                        ✓ Available ({available.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {available.map((p) => (
                          <span key={p.id} className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {unavailable.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-400 mb-1">
                        ✗ Not Available ({unavailable.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unavailable.map((p) => (
                          <span key={p.id} className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        Click on any cell to see who is available
      </div>
    </div>
  );
}
