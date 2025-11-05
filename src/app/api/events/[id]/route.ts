import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const { SchedulingAlgorithm } = await import('@/lib/scheduling-algorithm');

    // Extract timezone offset from query params (in minutes)
    const url = new URL(request.url);
    const timezoneOffset = parseInt(url.searchParams.get('tzOffset') || '0', 10);
    
    // Your existing GET logic here - keep it exactly the same
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: {
            timeSlots: {
              where: { eventId: params.id },
              orderBy: { startTime: 'asc' },
            },
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

    // Calculate response statistics
    const totalParticipants = event.participants.length;
    const respondedParticipants = event.participants.filter(
      (p: { timeSlots: any[] }) => p.timeSlots.length > 0
    ).length;

    // Group time slots by time for overlap analysis
    const timeSlotMap = new Map<string, { count: number; participantNames: string[] }>();
    event.participants.forEach((participant: { name: string; timeSlots: any[] }) => {
      participant.timeSlots.forEach((slot: { startTime: Date; endTime: Date }) => {
        const timeKey = `${slot.startTime.toISOString()}-${slot.endTime.toISOString()}`;
        const existing = timeSlotMap.get(timeKey) || { count: 0, participantNames: [] };
        timeSlotMap.set(timeKey, {
          count: existing.count + 1,
          participantNames: [...existing.participantNames, participant.name]
        });
      });
    });

    // Convert to array and sort by popularity
    const popularTimes = Array.from(timeSlotMap.entries())
      .map(([timeKey, data]) => {
        const [startTime, endTime] = timeKey.split('-');
        return {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          participantCount: data.count,
          participantNames: data.participantNames,
          percentage: Math.round((data.count / totalParticipants) * 100),
        };
      })
      .sort((a, b) => b.participantCount - a.participantCount);

    // Run the smart algorithm with timezone offset
    const algorithm = new SchedulingAlgorithm(
      {
        id: event.id,
        name: event.name,
        eventType: event.eventType as 'single-day' | 'multi-day',
        availabilityStartDate: event.availabilityStartDate,
        availabilityEndDate: event.availabilityEndDate,
        preferredTime: event.preferredTime || undefined,
        duration: event.duration || undefined,
        eventLength: event.eventLength || undefined,
        timingPreference: event.timingPreference || undefined,
      },
      event.participants.map((p: {
        id: string;
        name: string;
        timeSlots: any[]
      }) => ({
        id: p.id,
        name: p.name,
        hasResponded: p.timeSlots.length > 0,
        timeSlots: p.timeSlots,
      })),
      timezoneOffset // Pass timezone offset to algorithm
    );

    const smartRecommendations = algorithm.findOptimalTimes();

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        eventType: event.eventType,
        shareToken: event.shareToken, // For self-registration
        availabilityStartDate: event.availabilityStartDate,
        availabilityEndDate: event.availabilityEndDate,
        preferredTime: event.preferredTime,
        duration: event.duration,
        eventLength: event.eventLength,
        timingPreference: event.timingPreference,
        isFinalized: event.isFinalized,
        finalStartDate: event.finalStartDate,
        finalEndDate: event.finalEndDate,
        creatorId: event.creatorId,
      },
      participants: event.participants.map((p: {
        id: string;
        name: string;
        phoneNumber: string | null;
        smsOptIn: boolean;
        timeSlots: any[]
      }) => ({
        id: p.id,
        name: p.name,
        phoneNumber: p.phoneNumber,
        smsOptIn: p.smsOptIn, // Show SMS opt-in status
        hasResponded: p.timeSlots.length > 0,
        responseCount: p.timeSlots.length,
        timeSlots: p.timeSlots,
      })),
      stats: {
        totalParticipants,
        respondedParticipants,
        responseRate: Math.round((respondedParticipants / totalParticipants) * 100),
      },
      popularTimes: popularTimes.slice(0, 5),
      smartRecommendations,
    });

  } catch (error) {
    console.error('Error fetching event dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { stackServerApp } = await import('@/lib/stack');
    const { prisma } = await import('@/lib/prisma');

    // Get the current user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if event exists and user is the creator
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete events you created' },
        { status: 403 }
      );
    }

    // Delete the event (this will cascade delete participants and time slots)
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}