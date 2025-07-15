import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    const { sendEventInvitation } = await import('@/lib/email');
    const { verifyToken } = await import('@/lib/auth');
    
    // Check authentication from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const token = cookieStore.get('session-id')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Ensure user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    const processedBody = {
      ...body,
      availabilityStartDate: new Date(body.availabilityStartDate),
      availabilityEndDate: new Date(body.availabilityEndDate),
    };
    
    const validatedData = eventFormSchema.parse(processedBody);

    // Start a transaction to ensure data consistency update
    const result = await prisma.$transaction(async (tx: any) => {
      // Your existing transaction logic here - keep it exactly the same
      const participantData = validatedData.participants.map((participant) => ({
        name: participant.name,
        phoneNumber: participant.phoneNumber || '',
        email: participant.email,
        token: randomUUID(),
      }));

      const createdParticipants = await Promise.all(
        participantData.map((data) =>
          tx.participant.create({
            data,
          })
        )
      );

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
          creatorId: payload.userId, // Use authenticated user's ID
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

    // Send email invitations
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailResults = await Promise.all(
      result.participants
        .filter((participant: any) => participant.email) // Only send to participants with email
        .map(async (participant: any) => {
          const availabilityUrl = `${appUrl}/respond/${participant.token}`;
          return await sendEventInvitation(
            participant.email,
            participant.name,
            result.name,
            result.creator.name,
            availabilityUrl
          );
        })
    );

    console.log('Email sending results:', emailResults);

    return NextResponse.json({
      success: true,
      id: result.id,
      name: result.name,
      description: result.description,
      eventType: result.eventType,
      emailResults: emailResults,
      creator: {
        id: result.creator.id,
        name: result.creator.name,
        email: result.creator.email,
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