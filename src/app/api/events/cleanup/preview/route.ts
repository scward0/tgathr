import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { previewCleanup } from '@/lib/services/cleanup-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/cleanup/preview
 * Preview what events would be deleted without actually deleting them
 * Requires authentication
 */
export async function GET(_request: Request) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`👀 Cleanup preview requested by user: ${user.id}`);

    // Get preview of what would be deleted
    const result = await previewCleanup();

    return NextResponse.json({
      success: true,
      count: result.count,
      events: result.events
    });
  } catch (error) {
    console.error('Error in cleanup preview endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
