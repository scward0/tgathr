'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventFormData, eventFormSchema } from '@/types/event';
import { useRouter } from 'next/navigation';

export function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      participants: [{ name: '', phoneNumber: '' }],
      eventType: 'single-day',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  const eventType = watch('eventType');

  // Add this debugging block:
  const formData = watch();
  const formErrors = errors;

  console.log('Current form data:', formData);
  console.log('Current form errors:', formErrors);
  console.log('Event type:', eventType);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: EventFormData) => {
    console.log('Form data being submitted:', data); // Add this line
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
  
      const result = await response.json();
      console.log('Event created:', result);
      
      
      // Redirect to dashboard instead of alert
      router.push(`/events/${result.id}`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-4 overflow-x-hidden">
      {/* Event Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Event Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
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
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Enter event description"
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Event Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Event Type
        </label>
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
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-white">Multi-Day Event (vacation, trip, retreat)</span>
          </label>
        </div>
        {errors.eventType && (
          <p className="text-sm text-red-400">{errors.eventType.message}</p>
        )}
      </div>

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

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-300">
            Participants
          </label>
          <button
            type="button"
            onClick={() => append({ name: '', phoneNumber: '' })}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            + Add Participant
          </button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 p-3 bg-gray-800 rounded-md border border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Participant {index + 1}</span>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-300 transition-colors text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    {...register(`participants.${index}.name`)}
                    type="text"
                    placeholder="Name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.participants?.[index]?.name && (
                    <p className="text-sm text-red-400 mt-1">
                      {errors.participants[index]?.name?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <input
                    {...register(`participants.${index}.phoneNumber`)}
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.participants?.[index]?.phoneNumber && (
                    <p className="text-sm text-red-400 mt-1">
                      {errors.participants[index]?.phoneNumber?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}