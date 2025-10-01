import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { createEvent, validateEventData } from '@/lib/services/event-service';
import { isErrorResponse } from '@/lib/types/service-responses';

export async function POST(request: Request) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    // Check authentication with Neon Auth
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate the request data
    const validationResult = validateEventData(body);
    if (isErrorResponse(validationResult)) {
      return NextResponse.json(
        { error: validationResult.error, details: validationResult.details },
        { status: validationResult.status }
      );
    }

    // Create the event - convert Stack user to AuthenticatedUser
    const authUser = {
      id: user.id,
      displayName: user.displayName ?? undefined,
      primaryEmail: user.primaryEmail ?? undefined
    };
    const result = await createEvent(validationResult.data!, authUser);
    if (isErrorResponse(result)) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });

  } catch (error) {
    console.error('Error in events route:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}