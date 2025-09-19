import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { eventFormSchema } from '@/types/event';
import { sendEventInvitation } from '@/lib/email';

export type EventCreationData = z.infer<typeof eventFormSchema>;

export interface EventCreationResult {
  success: true;
  id: string;
  name: string;
  description?: string;
  eventType: string;
  emailResults: any[];
  creator: {
    id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    id: string;
    name: string;
    token: string;
  }>;
}

export interface EventCreationError {
  error: string;
  details?: any;
  status: number;
}

export interface AuthenticatedUser {
  id: string;
  displayName?: string;
  primaryEmail?: string;
}

export async function createEvent(
  data: EventCreationData,
  user: AuthenticatedUser
): Promise<EventCreationResult | EventCreationError> {
  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      const participantData = data.participants.map((participant) => ({
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
          name: data.name,
          description: data.description,
          eventType: data.eventType,
          availabilityStartDate: data.availabilityStartDate,
          availabilityEndDate: data.availabilityEndDate,
          preferredTime: data.eventType === 'single-day' ? data.preferredTime : null,
          duration: data.eventType === 'single-day' ? data.duration : null,
          eventLength: data.eventType === 'multi-day' ? data.eventLength : null,
          timingPreference: data.eventType === 'multi-day' ? data.timingPreference : null,
          finalStartDate: null,
          finalEndDate: null,
          isFinalized: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          creatorId: user.id,
          participants: {
            connect: createdParticipants.map((p) => ({ id: p.id })),
          },
        },
        include: {
          participants: true,
        },
      });

      return event;
    });

    // Send email invitations
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailResults = await Promise.all(
      result.participants
        .filter((participant: any) => participant.email)
        .map(async (participant: any) => {
          const availabilityUrl = `${appUrl}/respond/${participant.token}`;
          return await sendEventInvitation(
            participant.email,
            participant.name,
            result.name,
            user.displayName || user.primaryEmail || 'Event Organizer',
            availabilityUrl
          );
        })
    );

    console.log('Email sending results:', emailResults);

    return {
      success: true,
      id: result.id,
      name: result.name,
      description: result.description,
      eventType: result.eventType,
      emailResults: emailResults,
      creator: {
        id: user.id,
        name: user.displayName || 'Event Organizer',
        email: user.primaryEmail || '',
      },
      participants: result.participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        token: p.token,
      })),
    };

  } catch (error) {
    console.error('Error creating event:', error);

    if (error instanceof z.ZodError) {
      return {
        error: 'Validation error',
        details: error.errors,
        status: 400
      };
    }

    return {
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
}

export function validateEventData(body: unknown): EventCreationData | EventCreationError {
  try {
    const processedBody = {
      ...body,
      availabilityStartDate: new Date((body as any).availabilityStartDate),
      availabilityEndDate: new Date((body as any).availabilityEndDate),
    };

    return eventFormSchema.parse(processedBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: 'Validation error',
        details: error.errors,
        status: 400
      };
    }
    return {
      error: 'Failed to validate data',
      status: 500
    };
  }
}