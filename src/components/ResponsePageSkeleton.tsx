import React from 'react';

/**
 * Skeleton loader for the availability response page
 * Shows loading state while event and participant data is being fetched
 */
export function ResponsePageSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-900 py-8"
      role="status"
      aria-label="Loading event data"
      aria-busy="true"
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* Event Header Skeleton */}
        <div className="text-center mb-8">
          <div className="h-9 bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
          <div className="h-5 bg-gray-700 rounded w-1/2 mx-auto animate-pulse" />
        </div>

        {/* Event Details Card Skeleton */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse" />

          <div className="space-y-3">
            <div className="h-5 bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-5 bg-gray-700 rounded w-5/6 animate-pulse" />
            <div className="h-5 bg-gray-700 rounded w-4/5 animate-pulse" />
          </div>
        </div>

        {/* Welcome Message Skeleton */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-6 mb-8">
          <div className="h-6 bg-blue-800 rounded w-1/3 mb-2 animate-pulse" />
          <div className="h-5 bg-blue-800 rounded w-full animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse" />

          {/* Date selector skeleton */}
          <div className="space-y-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-750 rounded-lg p-4">
                <div className="h-5 bg-gray-700 rounded w-24 mb-3 animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Submit button skeleton */}
          <div className="h-12 bg-gray-700 rounded w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
