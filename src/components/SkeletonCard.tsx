import React from 'react';

/**
 * Skeleton card component for dashboard event cards
 * Shows a loading placeholder with shimmer animation
 */
export function SkeletonCard() {
  return (
    <div
      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
      role="status"
      aria-label="Loading event"
      aria-busy="true"
    >
      <div className="mb-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />

        {/* Description skeleton */}
        <div className="h-4 bg-gray-700 rounded w-full mb-1 animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-5/6 mb-3 animate-pulse" />

        {/* Badges skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-20 bg-gray-700 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-gray-700 rounded flex-1 animate-pulse" />
        <div className="h-10 bg-gray-700 rounded w-24 animate-pulse" />
      </div>
    </div>
  );
}
