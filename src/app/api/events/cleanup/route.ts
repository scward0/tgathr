import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { runCleanup } from '@/lib/services/cleanup-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/cleanup
 * Run the full cleanup process (send notifications + delete expired events)
 * Requires authentication
 */
export async function POST(_request: Request) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For security, you might want to restrict this to admin users only
    // For now, any authenticated user can trigger cleanup
    console.log(`🧹 Cleanup triggered by user: ${user.id}`);

    // Run the cleanup process
    const result = await runCleanup();

    if (result.success && 'notifications' in result && 'deletions' in result) {
      return NextResponse.json({
        success: true,
        timestamp: result.timestamp,
        notifications: {
          sent: result.notifications.successCount,
          failed: result.notifications.failureCount,
          total: result.notifications.total
        },
        deletions: {
          deleted: result.deletions.deletedCount,
          errors: result.deletions.errors.length
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Cleanup process failed',
        details: 'error' in result ? result.error : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
