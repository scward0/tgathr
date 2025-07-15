'use client'

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { useEffect, useState } from 'react';

interface UserEvent {
  id: string;
  name: string;
  description: string | null;
  eventType: string;
  availabilityStartDate: string;
  availabilityEndDate: string;
  isFinalized: boolean;
  participantCount: number;
  createdAt: string;
  expiresAt: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  const fetchUserEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch('/api/events/my-events', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (!user) {
    // Not logged in - show landing page
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <h1 className="text-4xl font-bold tracking-tight mb-8 text-white">tgathr</h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-md">
          Group coordination made simple
        </p>
        <div className="space-x-4">
          <Link 
            href="/auth"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth"
            className="px-6 py-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </main>
    );
  }

  // Logged in - show dashboard
  return (
    <main className="min-h-screen bg-gray-900">
      <nav className="flex justify-between items-center p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">tgathr</h1>
        <UserMenu />
      </nav>
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome, {user.name}!</h2>
          <p className="text-gray-300 mb-8">Ready to organize your next event?</p>
          <Link 
            href="/events/new"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Event
          </Link>
        </div>

        {/* User's Events Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Your Events</h3>
            <button 
              onClick={fetchUserEvents}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Refresh
            </button>
          </div>

          {eventsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading your events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">You haven't created any events yet.</p>
              <Link 
                href="/events/new"
                className="text-blue-400 hover:text-blue-300"
              >
                Create your first event →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{event.name}</h4>
                    {event.description && (
                      <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${event.eventType === 'single-day' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                        {event.eventType}
                      </span>
                      <span className={`px-2 py-1 rounded ${event.isFinalized ? 'bg-purple-900 text-purple-300' : 'bg-yellow-900 text-yellow-300'}`}>
                        {event.isFinalized ? 'Finalized' : 'Collecting responses'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1 mb-4">
                    <div>Participants: {event.participantCount}</div>
                    <div>Created: {new Date(event.createdAt).toLocaleDateString()}</div>
                    <div>Expires: {new Date(event.expiresAt).toLocaleDateString()}</div>
                  </div>

                  <Link 
                    href={`/events/${event.id}`}
                    className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm transition-colors"
                  >
                    View Event
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}