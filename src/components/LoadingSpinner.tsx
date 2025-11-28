import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Reusable loading spinner component with ARIA support
 * Displays an animated spinner with optional label text
 */
export function LoadingSpinner({
  size = 'md',
  className = '',
  label = 'Loading'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className={`${sizeClasses[size]} border-white border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-white">{label}</span>}
    </div>
  );
}
