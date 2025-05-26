'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { AvailabilityForm } from '@/components/AvailabilityForm';

interface ResponsePageProps {
  params: {
    token: string;
  };
}

export default function ResponsePage({ params }: ResponsePageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchParticipantData() {
      try {
        const response = await fetch(`/api/participants/${params.token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch participant data');
        }
        
        const participantData = await response.json();
        setData(participantData);
      } catch (err) {
        console.error('Error fetching participant data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    }

    fetchParticipantData();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading event data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Event not found'}</div>
      </div>
    );
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
          <p className="text-gray-300">
            Organized by {event.creator.name}
          </p>
          {event.description && (
            <p className="text-gray-400 mt-2">{event.description}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
          
          <div className="space-y-3 text-gray-300">
            <div>
              <span className="font-medium">Type:</span>{' '}
              {event.eventType === 'single-day' ? 'Single Day Event' : 'Multi-Day Event'}
            </div>
            
            <div>
              <span className="font-medium">Looking for availability between:</span>{' '}
              {new Date(event.availabilityStartDate).toLocaleDateString()} - {' '}
              {new Date(event.availabilityEndDate).toLocaleDateString()}
            </div>

            {event.preferredTime && (
              <div>
                <span className="font-medium">Preferred time:</span>{' '}
                {event.preferredTime.replace('-', ' ').toUpperCase()}
              </div>
            )}

            {event.duration && (
              <div>
                <span className="font-medium">Duration:</span>{' '}
                {event.duration.replace('-', ' ')}
              </div>
            )}

            {event.eventLength && (
              <div>
                <span className="font-medium">Event length:</span>{' '}
                {event.eventLength.replace('-', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">
            Hi {participant.name}! 👋
          </h2>
          <p className="text-blue-100">
            Please submit your availability below. We'll find the best time that works for everyone!
          </p>
        </div>

        {/* Availability Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <AvailabilityForm 
            event={{
              id: event.id,
              name: event.name,
              eventType: event.eventType,
              availabilityStartDate: event.availabilityStartDate,
              availabilityEndDate: event.availabilityEndDate,
              preferredTime: event.preferredTime || undefined,
              duration: event.duration || undefined,
              eventLength: event.eventLength || undefined,
              timingPreference: event.timingPreference || undefined,
            }}
            participant={participant} 
          />
        </div>
      </div>
    </div>
  );
}