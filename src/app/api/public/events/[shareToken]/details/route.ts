import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    shareToken: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    const event = await prisma.event.findUnique({
      where: { shareToken: params.shareToken },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            smsOptIn: true,
            createdAt: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event has expired
    const isExpired = new Date() > event.expiresAt;

    return NextResponse.json({
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
        isFinalized: event.isFinalized,
        finalStartDate: event.finalStartDate,
        finalEndDate: event.finalEndDate,
        expiresAt: event.expiresAt,
        isExpired,
        participantCount: event.participants.length,
      },
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event data' },
      { status: 500 }
    );
  }
}
