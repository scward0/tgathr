import { NextResponse } from 'next/server';

export async function POST(request: Request) {

    // Debug logging
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    // Dynamic imports
    const { eventFormSchema } = await import('@/types/event');
    const { z } = await import('zod');
    const { randomUUID } = await import('crypto');
    const { prisma } = await import('@/lib/prisma');
    const { sendEventInvitation } = await import('@/lib/sms');
    
    // Parse and validate request body
    const body = await request.json();
    
    const processedBody = {
      ...body,
      availabilityStartDate: new Date(body.availabilityStartDate),
      availabilityEndDate: new Date(body.availabilityEndDate),
    };
    
    const validatedData = eventFormSchema.parse(processedBody);

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Your existing transaction logic here - keep it exactly the same
      const participantData = validatedData.participants.map((participant) => ({
        name: participant.name,
        phoneNumber: participant.phoneNumber,
        token: randomUUID(),
      }));

      const createdParticipants = await Promise.all(
        participantData.map((data) =>
          tx.participant.create({
            data,
          })
        )
      );

      const creator = createdParticipants[0];

      const event = await tx.event.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          eventType: validatedData.eventType,
          availabilityStartDate: validatedData.availabilityStartDate,
          availabilityEndDate: validatedData.availabilityEndDate,
          preferredTime: validatedData.eventType === 'single-day' ? validatedData.preferredTime : null,
          duration: validatedData.eventType === 'single-day' ? validatedData.duration : null,
          eventLength: validatedData.eventType === 'multi-day' ? validatedData.eventLength : null,
          timingPreference: validatedData.eventType === 'multi-day' ? validatedData.timingPreference : null,
          finalStartDate: null,
          finalEndDate: null,
          isFinalized: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          creatorId: creator.id,
          participants: {
            connect: createdParticipants.map((p) => ({ id: p.id })),
          },
        },
        include: {
          creator: true,
          participants: true,
        },
      });

      return event;
    });

    // Send SMS invitations
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const smsResults = await Promise.all(
      result.participants.map(async (participant: any) => {
        const availabilityUrl = `${appUrl}/respond/${participant.token}`;
        return await sendEventInvitation(
          participant.phoneNumber,
          participant.name,
          result.name,
          result.creator.name,
          availabilityUrl
        );
      })
    );

    console.log('SMS sending results:', smsResults);

    return NextResponse.json({
      success: true,
      id: result.id,
      name: result.name,
      description: result.description,
      eventType: result.eventType,
      smsResults: smsResults,
      creator: {
        id: result.creator.id,
        name: result.creator.name,
        token: result.creator.token,
      },
      participants: result.participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        token: p.token,
      })),
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    
    const { z } = await import('zod');
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}