'use client';

import { useState } from 'react';
import { format, eachDayOfInterval } from 'date-fns';

interface AvailabilityFormProps {
  event: {
    id: string;
    name: string;
    eventType: string;
    availabilityStartDate: string;
    availabilityEndDate: string;
    preferredTime?: string;
    duration?: string;
    eventLength?: string;        // Add this
    timingPreference?: string;   // Add this
  };
  participant: {
    id: string;
    name: string;
    token: string;
  };
}

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  selected: boolean;
}

export function AvailabilityForm({ event, participant }: AvailabilityFormProps) {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generate date range
  const startDate = new Date(event.availabilityStartDate);
  const endDate = new Date(event.availabilityEndDate);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Generate time slots based on event type
  const generateTimeSlots = () => {
    if (event.eventType === 'single-day') {
      // For single-day events, show time slots for each day
      return [
        { label: 'Morning', value: '09:00-12:00' },
        { label: 'Afternoon', value: '13:00-17:00' },
        { label: 'Evening', value: '18:00-22:00' },
        { label: 'All Day', value: '09:00-22:00' },
      ];
    } else {
      // For multi-day events, just show full days
      return [
        { label: 'Available', value: 'all-day' },
      ];
    }
  };

  const timeSlots = generateTimeSlots();

  const toggleTimeSlot = (date: Date, timeSlot: string) => {
    setSelectedSlots(prev => {
      // Handle different time slot formats
      let startTime: string, endTime: string;
      
      if (timeSlot === 'all-day') {
        // For multi-day events
        startTime = '09:00';
        endTime = '17:00';
      } else if (timeSlot.includes('-')) {
        // For single-day events with time ranges like "09:00-12:00"
        [startTime, endTime] = timeSlot.split('-');
      } else {
        // Fallback
        startTime = '09:00';
        endTime = '17:00';
      }
  
      const existing = prev.find(slot => 
        format(slot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
        slot.startTime === startTime
      );
  
      if (existing) {
        // Remove the slot
        return prev.filter(slot => 
          !(format(slot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
            slot.startTime === startTime)
        );
      } else {
        // Add the slot
        return [...prev, {
          date,
          startTime,
          endTime,
          selected: true,
        }];
      }
    });
  };

const isSlotSelected = (date: Date, timeSlot: string) => {
  let startTime: string;
  
  if (timeSlot === 'all-day') {
    startTime = '09:00';
  } else if (timeSlot.includes('-')) {
    [startTime] = timeSlot.split('-');
  } else {
    startTime = '09:00';
  }
  
  return selectedSlots.some(slot => 
    format(slot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
    slot.startTime === startTime
  );
};

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          participantToken: participant.token,
          timeSlots: selectedSlots.map(slot => ({
            startTime: new Date(`${format(slot.date, 'yyyy-MM-dd')}T${slot.startTime}`),
            endTime: new Date(`${format(slot.date, 'yyyy-MM-dd')}T${slot.endTime}`),
          })),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to submit availability');
      }
    } catch (error) {
      console.error('Error submitting availability:', error);
      alert('Failed to submit availability. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-900/50 border border-green-700 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Availability Submitted!
        </h3>
        <p className="text-green-100">
          Thanks {participant.name}! We&apos;ll let you know once everyone responds and the organizer picks the best time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Select Your Available Times
        </h3>
        <p className="text-gray-400 text-sm">
          Click the times when you&apos;re available. You can select multiple options.
        </p>
      </div>

      {/* Date Grid */}
      <div className="space-y-4">
        {dateRange.map((date) => (
          <div key={date.toISOString()} className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">
              {format(date, 'EEEE, MMMM d')}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = isSlotSelected(date, slot.value);
                return (
                  <button
                    key={slot.value}
                    onClick={() => toggleTimeSlot(date, slot.value)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }
                    `}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Summary */}
      {selectedSlots.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-100 font-medium mb-2">
            Selected Times ({selectedSlots.length}):
          </h4>
          <div className="text-blue-200 text-sm space-y-1">
            {selectedSlots.map((slot, index) => (
              <div key={index}>
                {format(slot.date, 'MMM d')} • {slot.startTime}-{slot.endTime}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={selectedSlots.length === 0 || isSubmitting}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : `Submit Availability (${selectedSlots.length} times selected)`}
      </button>
    </div>
  );
}