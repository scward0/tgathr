'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';

interface EventPageProps {
  params: {
    shareToken: string;
  };
}

interface EventData {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  availabilityStartDate: string;
  availabilityEndDate: string;
  preferredTime?: string;
  duration?: string;
  eventLength?: string;
  timingPreference?: string;
  isFinalized: boolean;
  finalStartDate?: string | null;
  finalEndDate?: string | null;
  isExpired: boolean;
  participantCount: number;
}

export default function PublicEventPage({ params }: EventPageProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [checkingExistingRegistration, setCheckingExistingRegistration] = useState(true);
  const [downloadingCalendar, setDownloadingCalendar] = useState(false);

  // Registration form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);

  // Check for existing registration on mount
  useEffect(() => {
    async function checkExistingRegistration() {
      try {
        // Check localStorage for saved editToken for this event
        const storageKey = `tgathr_participant_${params.shareToken}`;
        const savedEditToken = localStorage.getItem(storageKey);

        if (savedEditToken) {
          // Validate the editToken by checking if participant still exists
          const response = await fetch(`/api/participants/${savedEditToken}`);

          if (response.ok) {
            // Valid token - redirect to edit page
            router.push(`/p/${savedEditToken}`);
            return;
          } else {
            // Invalid token - remove from localStorage
            localStorage.removeItem(storageKey);
          }
        }
      } catch (err) {
        console.error('Error checking existing registration:', err);
        // Continue to show registration form
      } finally {
        setCheckingExistingRegistration(false);
      }
    }

    checkExistingRegistration();
  }, [params.shareToken, router]);

  useEffect(() => {
    async function fetchEventData() {
      try {
        const response = await fetch(`/api/public/events/${params.shareToken}/details`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch event data');
        }

        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    }

    fetchEventData();
  }, [params.shareToken]);

  const handleSubmitRegistration = async () => {
    // Validate form
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (smsOptIn && !phone.trim()) {
      setError('Phone number is required for SMS notifications');
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/events/${params.shareToken}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phoneNumber: smsOptIn ? phone : undefined,
          smsOptIn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await response.json();

      // Save editToken to localStorage for return visitor flow
      const storageKey = `tgathr_participant_${params.shareToken}`;
      localStorage.setItem(storageKey, result.editToken);

      // Redirect to availability submission page
      router.push(`/respond/${result.editToken}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) {
      return;
    }

    setDownloadingCalendar(true);

    try {
      const response = await fetch(`/api/public/events/${params.shareToken}/calendar`);

      if (!response.ok) {
        throw new Error('Failed to generate calendar file');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.ics`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Calendar export failed:', err);
      setError('Failed to download calendar file. Please try again.');
    } finally {
      setDownloadingCalendar(false);
    }
  };

  if (loading || checkingExistingRegistration) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          {checkingExistingRegistration ? 'Checking for existing registration...' : 'Loading event...'}
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  // Show event details and registration form
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {event.name}
          </h1>
          {event.description && (
            <p className="text-gray-300 text-lg">{event.description}</p>
          )}
          <p className="text-gray-500 mt-2">
            {event.participantCount} {event.participantCount === 1 ? 'person has' : 'people have'} registered
          </p>
        </div>

        {/* Event Status Warnings */}
        {event.isFinalized && event.finalStartDate && event.finalEndDate && (
          <div className="bg-blue-900/30 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-lg mb-1">This event has been finalized</p>
                <p className="text-blue-200">
                  {new Date(event.finalStartDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(event.finalStartDate).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  })}
                </p>
              </div>
              <button
                onClick={handleAddToCalendar}
                disabled={downloadingCalendar}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {downloadingCalendar ? 'Downloading...' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        )}

        {event.isFinalized && (!event.finalStartDate || !event.finalEndDate) && (
          <div className="bg-blue-900/30 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg mb-6">
            This event has already been finalized.
          </div>
        )}

        {event.isExpired && !event.isFinalized && (
          <div className="bg-yellow-900/30 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg mb-6">
            This event has expired.
          </div>
        )}

        {/* Event Details Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>

          <div className="space-y-3 text-gray-300">
            <div>
              <span className="font-medium text-gray-400">Type:</span>{' '}
              {event.eventType === 'single-day' ? 'Single Day Event' : 'Multi-Day Event'}
            </div>

            <div>
              <span className="font-medium text-gray-400">Looking for availability:</span>{' '}
              {new Date(event.availabilityStartDate).toLocaleDateString()} - {' '}
              {new Date(event.availabilityEndDate).toLocaleDateString()}
            </div>

            {event.preferredTime && (
              <div>
                <span className="font-medium text-gray-400">Preferred time:</span>{' '}
                {event.preferredTime.replace('-', ' ').toUpperCase()}
              </div>
            )}

            {event.duration && (
              <div>
                <span className="font-medium text-gray-400">Duration:</span>{' '}
                {event.duration.replace('-', ' ')}
              </div>
            )}

            {event.eventLength && (
              <div>
                <span className="font-medium text-gray-400">Event length:</span>{' '}
                {event.eventLength.replace('-', ' ')}
              </div>
            )}

            {event.timingPreference && (
              <div>
                <span className="font-medium text-gray-400">Timing:</span>{' '}
                {event.timingPreference.replace('-', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        {!event.isFinalized && !event.isExpired && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Register for this Event</h2>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* SMS Opt-in Checkbox */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsOptIn}
                    onChange={(e) => setSmsOptIn(e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-white font-medium">
                      Send me SMS notifications
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Get notified via text when the event date is finalized
                    </div>
                  </div>
                </label>
              </div>

              {/* Phone Number Input (conditional) */}
              {smsOptIn && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                    required={smsOptIn}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Required for SMS notifications. Reply STOP to opt out anytime.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitRegistration}
                disabled={registering}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {registering ? 'Registering...' : 'Continue to Submit Availability'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
