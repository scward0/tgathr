'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { AvailabilityForm } from '@/components/AvailabilityForm';

interface ParticipantEditPageProps {
  params: {
    editToken: string;
  };
}

export default function ParticipantEditPage({ params }: ParticipantEditPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);

  useEffect(() => {
    async function fetchParticipantData() {
      try {
        const response = await fetch(`/api/participants/${params.editToken}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch participant data');
        }

        const participantData = await response.json();
        setData(participantData);

        // Initialize form state
        setName(participantData.participant.name);
        setPhone(participantData.participant.phoneNumber || '');
        setSmsOptIn(participantData.participant.smsOptIn || false);
      } catch (err) {
        console.error('Error fetching participant data:', err);
        setError('Failed to load your registration data');
      } finally {
        setLoading(false);
      }
    }

    fetchParticipantData();
  }, [params.editToken]);

  const handleSaveInfo = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/participants/${params.editToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phoneNumber: smsOptIn ? phone : null,
          smsOptIn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update');
      }

      const result = await response.json();

      // Update local data
      setData((prev: any) => ({
        ...prev,
        participant: {
          ...prev.participant,
          name: result.participant.name,
          phoneNumber: result.participant.phoneNumber,
          smsOptIn: result.participant.smsOptIn,
        },
      }));

      setEditingInfo(false);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading your registration...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { participant, event } = data;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {event.name}
          </h1>
          {event.description && (
            <p className="text-gray-400 mt-2">{event.description}</p>
          )}
          <p className="text-gray-500 mt-2">
            Managing response for: <strong className="text-white">{participant.name}</strong>
          </p>
        </div>

        {/* Your Information Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Your Information</h2>
            <button
              onClick={() => setEditingInfo(!editingInfo)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {editingInfo ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingInfo ? (
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-gray-300">
              <div>
                <span className="font-medium text-gray-400">Name:</span>{' '}
                {participant.name}
              </div>
              {participant.phoneNumber && (
                <div>
                  <span className="font-medium text-gray-400">Phone:</span>{' '}
                  {participant.phoneNumber}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-400">SMS Notifications:</span>{' '}
                {participant.smsOptIn ? (
                  <span className="text-green-400">Enabled</span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>

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

        {/* Availability Form */}
        <AvailabilityForm
          event={event}
          participant={participant}
        />
      </div>
    </div>
  );
}
