import { NextResponse } from 'next/server';
import { z } from 'zod';

interface RouteParams {
  params: {
    token: string;
  };
}

// Validation schema for participant updates
const updateParticipantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional().nullable(),
  smsOptIn: z.boolean().optional(),
});

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
        events: true,
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
        creatorId: event.creatorId,
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

export async function PUT(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const body = await request.json();

    // Validate request body
    const validationResult = updateParticipantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Validate SMS opt-in requirement
    if (updates.smsOptIn === true && !updates.phoneNumber) {
      // Check if participant already has a phone number
      const existing = await prisma.participant.findUnique({
        where: { token: params.token },
        select: { phoneNumber: true },
      });

      if (!existing?.phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number is required when opting in to SMS notifications' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phoneNumber = updates.phoneNumber;
    }
    if (updates.smsOptIn !== undefined) {
      updateData.smsOptIn = updates.smsOptIn;
      if (updates.smsOptIn === true && !updateData.smsOptInAt) {
        updateData.smsOptInAt = new Date();
      } else if (updates.smsOptIn === false) {
        updateData.smsOptInAt = null;
      }
    }

    // Update participant
    const participant = await prisma.participant.update({
      where: { token: params.token },
      data: updateData,
    });

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        phoneNumber: participant.phoneNumber,
        smsOptIn: participant.smsOptIn,
        token: participant.token,
      },
      message: 'Participant updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating participant:', error);

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}