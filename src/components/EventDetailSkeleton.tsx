import React from 'react';

/**
 * Skeleton loader for event header section
 */
export function EventHeaderSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6" role="status" aria-label="Loading event header">
      {/* Title */}
      <div className="h-8 bg-gray-700 rounded w-2/3 mb-4 animate-pulse" />

      {/* Type badge */}
      <div className="h-6 bg-gray-700 rounded w-24 mb-4 animate-pulse" />

      {/* Share link section */}
      <div className="bg-gray-750 rounded-lg p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-700 rounded w-full animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for stats cards section
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" role="status" aria-label="Loading event statistics">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-6">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-3 animate-pulse" />
          <div className="h-10 bg-gray-700 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for smart recommendations section
 */
export function RecommendationsSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6" role="status" aria-label="Loading smart recommendations">
      {/* Section title */}
      <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse" />

      {/* Recommendation cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-750 rounded-lg p-4 border-2 border-gray-700">
            {/* Date and time */}
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-3 animate-pulse" />

            {/* Score badge */}
            <div className="h-6 bg-gray-700 rounded w-20 mb-3 animate-pulse" />

            {/* Participants */}
            <div className="flex gap-2 mb-3">
              <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Action button */}
            <div className="h-10 bg-gray-700 rounded w-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for participants list section
 */
export function ParticipantsListSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6" role="status" aria-label="Loading participants list">
      {/* Section title */}
      <div className="h-6 bg-gray-700 rounded w-40 mb-4 animate-pulse" />

      {/* Participant items */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-750 rounded-lg p-4 flex items-center justify-between">
            <div className="flex-1">
              {/* Name */}
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />

              {/* Status */}
              <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse" />
            </div>

            {/* Actions */}
            <div className="h-8 w-8 bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for availability heatmap
 */
export function HeatmapSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6" role="status" aria-label="Loading availability heatmap">
      {/* Section title */}
      <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse" />

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px] space-y-2">
          {/* Header row */}
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 flex-1 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>

          {/* Data rows */}
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex gap-2">
              <div className="h-12 w-32 bg-gray-700 rounded animate-pulse" />
              {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="h-12 flex-1 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for event details section
 */
export function EventDetailsSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6" role="status" aria-label="Loading event details">
      {/* Section title */}
      <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse" />

      {/* Detail items */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete event dashboard skeleton loader
 * Combines all sub-skeletons for the full page loading state
 */
export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900" aria-busy="true">
      <div className="container mx-auto px-4 py-8">
        <EventHeaderSkeleton />
        <StatsCardsSkeleton />
        <RecommendationsSkeleton />
        <ParticipantsListSkeleton />
        <HeatmapSkeleton />
        <EventDetailsSkeleton />
      </div>
    </div>
  );
}
