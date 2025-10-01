import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ServiceResponse, createErrorResponse, createSuccessResponse } from '@/lib/types/service-responses';

export const availabilitySchema = z.object({
  eventId: z.string().min(1),
  participantToken: z.string().min(1),
  timeSlots: z.array(z.object({
    startTime: z.string().transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date;
    }),
    endTime: z.string().transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date;
    }),
  })).min(1),
});

export type AvailabilitySubmission = z.infer<typeof availabilitySchema>;

export interface AvailabilityResult {
  slotsCreated: number;
  participant: string;
}

export async function saveAvailability(data: AvailabilitySubmission): Promise<ServiceResponse<AvailabilityResult>> {
  try {
    // Find the participant by token
    const participant = await prisma.participant.findUnique({
      where: { token: data.participantToken },
    });

    if (!participant) {
      return createErrorResponse('Invalid participant token', 404);
    }

    // Delete existing time slots for this participant/event (in case they're resubmitting)
    await prisma.timeSlot.deleteMany({
      where: {
        eventId: data.eventId,
        participantId: participant.id,
      },
    });

    // Create new time slots
    const timeSlots = await prisma.timeSlot.createMany({
      data: data.timeSlots.map((slot) => ({
        eventId: data.eventId,
        participantId: participant.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });

    console.log(`✅ ${participant.name} submitted ${data.timeSlots.length} time slots for event ${data.eventId}`);

    return createSuccessResponse({
      slotsCreated: timeSlots.count,
      participant: participant.name
    });

  } catch (error) {
    // Error logged internally

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid data format', 400, error.errors);
    }

    return createErrorResponse(
      'Failed to save availability',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateAvailabilityData(body: unknown): ServiceResponse<AvailabilitySubmission> {
  try {
    const validated = availabilitySchema.parse(body);
    return createSuccessResponse(validated);
  } catch (error) {
    // All schema validation errors should return 400
    return createErrorResponse(
      'Validation error',
      400,
      error instanceof z.ZodError ? error.errors : (error instanceof Error ? error.message : 'Invalid data')
    );
  }
}