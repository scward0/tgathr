import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SchedulingAlgorithm } from '@/lib/scheduling-algorithm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
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
    const timeSlotMap = new Map<string, number>();
    event.participants.forEach((participant: { timeSlots: any[] }) => {
      participant.timeSlots.forEach((slot: { startTime: Date; endTime: Date }) => {
        const timeKey = `${slot.startTime.toISOString()}-${slot.endTime.toISOString()}`;
        timeSlotMap.set(timeKey, (timeSlotMap.get(timeKey) || 0) + 1);
      });
    });

    // Convert to array and sort by popularity
    const popularTimes = Array.from(timeSlotMap.entries())
      .map(([timeKey, count]) => {
        const [startTime, endTime] = timeKey.split('-');
        return {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          participantCount: count,
          percentage: Math.round((count / totalParticipants) * 100),
        };
      })
      .sort((a, b) => b.participantCount - a.participantCount);

    // NEW: Run the smart algorithm
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
      }))
    );

    const smartRecommendations = algorithm.findOptimalTimes();

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
        creator: event.creator,
      },
      participants: event.participants.map((p: { 
        id: string; 
        name: string; 
        phoneNumber: string; 
        timeSlots: any[] 
      }) => ({
        id: p.id,
        name: p.name,
        phoneNumber: p.phoneNumber,
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
      smartRecommendations, // The new smart algorithm results
    });

  } catch (error) {
    console.error('Error fetching event dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event data' },
      { status: 500 }
    );
  }
}