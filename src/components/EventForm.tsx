'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventFormData, eventFormSchema } from '@/types/event';
import { useRouter } from 'next/navigation';

export function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventType: 'single-day',
    },
  });

  const eventType = watch('eventType');


  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setError(null); // Clear any previous errors

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await response.json();

      // Redirect to event dashboard with success state
      // The dashboard will show the shareable link
      router.push(`/events/${result.id}?created=true`);

    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-4 overflow-x-hidden">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900 border border-red-600 rounded-md">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Event Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Event Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          data-testid="event-name"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter event name"
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
          Description (Optional)
        </label>
        <textarea
          {...register('description')}
          id="description"
          data-testid="event-description"
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Enter event description"
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Event Type Selection */}
      <fieldset className="space-y-3">
        <legend className="block text-sm font-medium text-gray-300">
          Event Type
        </legend>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              {...register('eventType')}
              type="radio"
              value="single-day"
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-white">Single Day Event (party, dinner, meeting)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              {...register('eventType')}
              type="radio"
              value="multi-day"
              data-testid="event-type-multi-day"
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-white">Multi-Day Event (vacation, trip, retreat)</span>
          </label>
        </div>
        {errors.eventType && (
          <p className="text-sm text-red-400">{errors.eventType.message}</p>
        )}
      </fieldset>

      {/* Availability Window */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="availabilityStartDate" className="block text-sm font-medium text-gray-300">
            Availability Window Start
          </label>
          <input
            {...register('availabilityStartDate', { valueAsDate: true })}
            type="date"
            id="availabilityStartDate"
            data-testid="availability-start-date"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
          />
          {errors.availabilityStartDate && (
            <p className="text-sm text-red-400">{errors.availabilityStartDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="availabilityEndDate" className="block text-sm font-medium text-gray-300">
            Availability Window End
          </label>
          <input
            {...register('availabilityEndDate', { valueAsDate: true })}
            type="date"
            id="availabilityEndDate"
            data-testid="availability-end-date"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
          />
          {errors.availabilityEndDate && (
            <p className="text-sm text-red-400">{errors.availabilityEndDate.message}</p>
          )}
        </div>
      </div>

      {/* Single Day Event Options */}
      {eventType === 'single-day' && (
        <div className="space-y-4 p-4 bg-gray-800 rounded-md border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300">Single Day Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-300">
                Preferred Time
              </label>
              <select
                {...register('preferredTime')}
                id="preferredTime"
                data-testid="preferred-time"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select time...</option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="evening">Evening (5 PM - 10 PM)</option>
                <option value="all-day">All Day</option>
              </select>
              {errors.preferredTime && (
                <p className="text-sm text-red-400">{errors.preferredTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-300">
                Duration
              </label>
              <select
                {...register('duration')}
                id="duration"
                data-testid="duration"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select duration...</option>
                <option value="1-hour">1 Hour</option>
                <option value="2-hours">2 Hours</option>
                <option value="3-hours">3 Hours</option>
                <option value="4-hours">4 Hours</option>
                <option value="all-day">All Day</option>
              </select>
              {errors.duration && (
                <p className="text-sm text-red-400">{errors.duration.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Day Event Options */}
      {eventType === 'multi-day' && (
        <div className="space-y-4 p-4 bg-gray-800 rounded-md border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300">Multi-Day Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="eventLength" className="block text-sm font-medium text-gray-300">
                Event Length
              </label>
              <select
                {...register('eventLength')}
                id="eventLength"
                data-testid="event-length"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select length...</option>
                <option value="2-days">2 Days</option>
                <option value="3-days">3 Days</option>
                <option value="1-week">1 Week</option>
                <option value="2-weeks">2 Weeks</option>
              </select>
              {errors.eventLength && (
                <p className="text-sm text-red-400">{errors.eventLength.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="timingPreference" className="block text-sm font-medium text-gray-300">
                Timing Preference
              </label>
              <select
                {...register('timingPreference')}
                id="timingPreference"
                data-testid="timing-preference"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select preference...</option>
                <option value="weekends-only">Weekends Only</option>
                <option value="include-weekdays">Include Weekdays</option>
                <option value="flexible">Flexible</option>
              </select>
              {errors.timingPreference && (
                <p className="text-sm text-red-400">{errors.timingPreference.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participant Registration Info */}
      <div className="space-y-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-md">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-300">
              Self-Registration Event
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              After creating this event, you&apos;ll receive a shareable link. Share it with your group so they can register themselves and provide their availability.
            </p>
            <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Participants will add their own name and contact info</li>
              <li>They can opt-in to SMS notifications (A2P 10DLC compliant)</li>
              <li>Each person can edit their response anytime</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-button"
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}