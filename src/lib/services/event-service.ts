import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { eventFormSchema } from '@/types/event';
import { sendEventInvitation } from '@/lib/email';
import { ServiceResponse, createErrorResponse, createSuccessResponse } from '@/lib/types/service-responses';

export type EventCreationData = z.infer<typeof eventFormSchema>;

export interface EventCreationResult {
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

export interface AuthenticatedUser {
  id: string;
  displayName?: string;
  primaryEmail?: string;
}

export async function createEvent(
  data: EventCreationData,
  user: AuthenticatedUser
): Promise<ServiceResponse<EventCreationResult>> {
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
    const emailResults = await Promise.allSettled(
      result.participants
        .filter((participant: any) => participant.email)
        .map(async (participant: any) => {
          try {
            const availabilityUrl = `${appUrl}/respond/${participant.token}`;
            return await sendEventInvitation(
              participant.email,
              participant.name,
              result.name,
              user.displayName || user.primaryEmail || 'Event Organizer',
              availabilityUrl
            );
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Email sending failed',
            };
          }
        })
    );

    // Email results captured but not logged in production

    return createSuccessResponse({
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
    });

  } catch (error) {
    // Error logged internally

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error', 400, error.errors);
    }

    return createErrorResponse(
      'Failed to create event',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateEventData(body: unknown): ServiceResponse<EventCreationData> {
  try {
    // Cast body to object type to ensure spread operation is valid
    const bodyObj = body as Record<string, any>;

    // Handle null or undefined input
    if (!bodyObj || typeof bodyObj !== 'object') {
      return createErrorResponse('Invalid input data', 400, 'Input must be an object');
    }

    const processedBody = {
      ...bodyObj,
      availabilityStartDate: new Date(bodyObj.availabilityStartDate),
      availabilityEndDate: new Date(bodyObj.availabilityEndDate),
    };

    const validated = eventFormSchema.parse(processedBody);
    return createSuccessResponse(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    return createErrorResponse(
      'Failed to validate data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}