'use client';

import { format } from 'date-fns';

interface FinalizationConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  date: Date;
  timePeriodLabel: string;
  timeRange: string;
  availableCount: number;
  unavailableCount: number;
  isLoading?: boolean;
}

/**
 * Confirmation Dialog for Event Finalization
 *
 * Displays event details and requires explicit confirmation before finalizing.
 * Shows conflict warning if participants are unavailable.
 */
export function FinalizationConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  date,
  timePeriodLabel,
  timeRange,
  availableCount,
  unavailableCount,
  isLoading = false,
}: FinalizationConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="finalization-dialog-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
        <h2
          id="finalization-dialog-title"
          className="text-xl font-bold text-white mb-4"
        >
          Confirm Event Finalization
        </h2>

        <div className="space-y-4 text-gray-300">
          <p className="text-sm">
            You&apos;re about to finalize this event for:
          </p>

          {/* Event Details */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <div>
                <div className="font-medium text-white">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🕐</span>
              <div>
                <div className="font-medium text-white">
                  {timePeriodLabel}
                </div>
                <div className="text-xs text-gray-400">
                  {timeRange}
                </div>
              </div>
            </div>
          </div>

          {/* Participant Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✓</span>
              <span>{availableCount} participant{availableCount !== 1 ? 's' : ''} available</span>
            </div>
            {unavailableCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-yellow-300">
                  {unavailableCount} participant{unavailableCount !== 1 ? 's' : ''} unavailable
                </span>
              </div>
            )}
          </div>

          {/* Notification Info */}
          <p className="text-xs text-gray-400 border-t border-gray-700 pt-4">
            All participants will receive confirmation emails with calendar invites.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            aria-label="Cancel finalization"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            aria-label="Confirm event finalization"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Finalizing...</span>
              </>
            ) : (
              'Confirm Finalization'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
