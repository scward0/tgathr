import { NextResponse } from 'next/server';
import { eventFormSchema } from '@/types/event';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEventInvitation } from '@/lib/sms';
import { Prisma } from '@prisma/client'; // Add this import

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    const processedBody = {
      ...body,
      availabilityStartDate: new Date(body.availabilityStartDate),
      availabilityEndDate: new Date(body.availabilityEndDate),
    };
    
    const validatedData = eventFormSchema.parse(processedBody);

    // Create event in database (your existing code)
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // ... your existing event creation code stays exactly the same ...
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

    // NEW: Send SMS invitations to all participants
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const smsResults = await Promise.all(
      result.participants.map(async (participant: { phoneNumber: string; name: string; token: string }) => {
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

    // Log SMS results
    console.log('SMS sending results:', smsResults);

    // Format the response (your existing code)
    return NextResponse.json({
      success: true,
      id: result.id,
      name: result.name,
      description: result.description,
      eventType: result.eventType,
      smsResults: smsResults, // Include SMS results in response
      creator: {
        id: result.creator.id,
        name: result.creator.name,
        token: result.creator.token,
      },
      participants: result.participants.map((p) => ({
        id: p.id,
        name: p.name,
        token: p.token,
      })),
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    
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