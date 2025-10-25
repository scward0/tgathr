'use client'

import Link from 'next/link';
import { useUser } from '@stackframe/stack';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

interface UserEvent {
  id: string;
  name: string;
  description: string | null;
  eventType: string;
  availabilityStartDate: string;
  availabilityEndDate: string;
  isFinalized: boolean;
  finalStartDate?: string | null;
  finalEndDate?: string | null;
  participantCount: number;
  respondedParticipants: number;
  allResponded: boolean;
  createdAt: string;
  expiresAt: string;
  finalizedAt?: string | null;
  daysSinceFinalized?: number | null;
}

type FilterType = 'all' | 'active' | 'finalized' | 'expired';
type SortType = 'date' | 'name' | 'status';

// Helper functions for date formatting
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getRelativeTime(days: number | null | undefined): string {
  if (days === null || days === undefined) {
    return '';
  }
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)} weeks ago`;
  }
  if (days < 365) {
    return `${Math.floor(days / 30)} months ago`;
  }
  return `${Math.floor(days / 365)} years ago`;
}

export default function Home() {
  const user = useUser();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDebugInfo(`User state: ${user ? 'authenticated' : 'not authenticated'}`);

    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  // Add a timeout to handle stuck loading states
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user === undefined) {
        setLoadingTimeout(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
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
    } catch (_error) {
      // Error fetching events - silently fail
    } finally {
      setEventsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmation) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${deleteConfirmation.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove the event from the local state
        setEvents(events.filter(event => event.id !== deleteConfirmation.id));
        setDeleteConfirmation(null);
      } else {
        const data = await response.json();
        alert(`Failed to delete event: ${data.error || 'Unknown error'}`);
      }
    } catch (_error) {
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort events
  const getFilteredAndSortedEvents = () => {
    const now = new Date();

    // Filter events
    const filtered = events.filter(event => {
      const isExpired = new Date(event.expiresAt) < now;

      switch (filter) {
        case 'active':
          return !event.isFinalized && !isExpired;
        case 'finalized':
          return event.isFinalized;
        case 'expired':
          return isExpired;
        case 'all':
        default:
          return true;
      }
    });

    // Sort events
    filtered.sort((a, b) => {
      // Special sorting for finalized events when finalized filter is active
      if (filter === 'finalized' && a.finalizedAt && b.finalizedAt) {
        return new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime();
      }

      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status': {
          // Sort by isFinalized first, then by response rate
          if (a.isFinalized !== b.isFinalized) {
            return a.isFinalized ? 1 : -1;
          }
          const rateA = a.participantCount > 0 ? a.respondedParticipants / a.participantCount : 0;
          const rateB = b.participantCount > 0 ? b.respondedParticipants / b.participantCount : 0;
          return rateB - rateA;
        }
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  };

  // Calculate response rate and color
  const getResponseRateInfo = (event: UserEvent) => {
    if (event.participantCount === 0) {
      return { rate: 0, color: 'bg-gray-700 text-gray-300', label: '0%' };
    }

    const rate = event.respondedParticipants / event.participantCount;
    const percentage = Math.round(rate * 100);

    if (rate < 0.3) {
      return { rate, color: 'bg-red-900 text-red-300', label: `${percentage}% responded` };
    } else if (rate < 0.7) {
      return { rate, color: 'bg-yellow-900 text-yellow-300', label: `${percentage}% responded` };
    } else {
      return { rate, color: 'bg-green-900 text-green-300', label: `${percentage}% responded` };
    }
  };

  // Show debug info and handle loading states
  if (user === undefined && !loadingTimeout) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="text-white mb-4">Loading...</div>
        <div className="text-gray-400 text-sm">{debugInfo}</div>
        <div className="text-gray-500 text-xs mt-2">
          Check console for more details
        </div>
      </main>
    );
  }

  // If loading timeout reached, show the login page anyway
  // (No action needed, just fall through to render)

  if (user === null || (user === undefined && loadingTimeout)) {
    // Not logged in - show landing page
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <h1 className="text-4xl font-bold tracking-tight mb-8 text-white">tgathr</h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-md">
          Group coordination made simple
        </p>
        <div className="space-x-4">
          <Link 
            href="/handler/sign-in"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/handler/sign-up"
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
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {user?.displayName || user?.primaryEmail || 'User'}!</span>
          <button
            onClick={() => user.signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome, {user?.displayName || user?.primaryEmail || 'User'}!</h2>
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

          {/* Filter and Sort Controls */}
          <div className="mb-6 space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('finalized')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'finalized'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Finalized
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'expired'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Expired
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-400">Sort by:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {eventsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading your events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">You haven&apos;t created any events yet.</p>
              <Link
                href="/events/new"
                className="text-blue-400 hover:text-blue-300"
              >
                Create your first event →
              </Link>
            </div>
          ) : getFilteredAndSortedEvents().length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No events match the selected filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredAndSortedEvents().map((event) => {
                const responseRateInfo = getResponseRateInfo(event);
                const isExpired = new Date(event.expiresAt) < new Date();

                return (
                  <div key={event.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-2">{event.name}</h4>
                      {event.description && (
                        <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${event.eventType === 'single-day' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                          {event.eventType}
                        </span>
                        {event.isFinalized ? (
                          <span className="px-2 py-1 rounded bg-purple-900 text-purple-300">
                            Finalized
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">
                            Expired
                          </span>
                        ) : null}
                        <span className={`px-2 py-1 rounded ${responseRateInfo.color}`}>
                          {responseRateInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Finalized Event History Section */}
                    {event.isFinalized && event.finalStartDate ? (
                      <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-400 font-semibold">✅ Completed</span>
                          {event.daysSinceFinalized !== null && event.daysSinceFinalized !== undefined && (
                            <span className="text-xs text-gray-400">
                              {getRelativeTime(event.daysSinceFinalized)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-green-200 mb-2">
                          <div className="font-medium">Final Date:</div>
                          <div>
                            {event.eventType === 'single-day'
                              ? formatDateTime(event.finalStartDate)
                              : event.finalEndDate
                                ? `${formatDate(event.finalStartDate)} - ${formatDate(event.finalEndDate)}`
                                : formatDate(event.finalStartDate)
                            }
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {event.respondedParticipants}/{event.participantCount} participants confirmed
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 space-y-1 mb-4">
                        <div>Participants: {event.participantCount}</div>
                        <div>Responses: {event.respondedParticipants}/{event.participantCount}</div>
                        <div>Created: {new Date(event.createdAt).toLocaleDateString()}</div>
                        <div>Expires: {new Date(event.expiresAt).toLocaleDateString()}</div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm transition-colors"
                      >
                        View Event
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmation({ id: event.id, name: event.name })}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors"
                        title="Delete event"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Event?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete &quot;{deleteConfirmation.name}&quot;? This action cannot be undone.
              All participants and availability data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}