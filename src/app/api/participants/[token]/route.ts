import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    
    const participant = await prisma.participant.findUnique({
      where: { token: params.token },
      include: {
        events: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!participant || participant.events.length === 0) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Get the most recent event for this participant
    const event = participant.events[0];
    
    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        token: participant.token,
      },
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        eventType: event.eventType,
        availabilityStartDate: event.availabilityStartDate,
        availabilityEndDate: event.availabilityEndDate,
        preferredTime: event.preferredTime,
        duration: event.duration,
        eventLength: event.eventLength,
        timingPreference: event.timingPreference,
        creator: event.creator,
      },
    });

  } catch (error) {
    console.error('Error fetching participant/event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant data' },
      { status: 500 }
    );
  }
}