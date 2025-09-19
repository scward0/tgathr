import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const availabilitySchema = z.object({
  eventId: z.string(),
  participantToken: z.string(),
  timeSlots: z.array(z.object({
    startTime: z.string().transform((str) => new Date(str)),
    endTime: z.string().transform((str) => new Date(str)),
  })),
});

export type AvailabilitySubmission = z.infer<typeof availabilitySchema>;

export interface AvailabilityResult {
  success: boolean;
  slotsCreated: number;
  participant: string;
}

export interface AvailabilityError {
  error: string;
  details?: any;
  status: number;
}

export async function saveAvailability(data: AvailabilitySubmission): Promise<AvailabilityResult | AvailabilityError> {
  try {
    // Find the participant by token
    const participant = await prisma.participant.findUnique({
      where: { token: data.participantToken },
    });

    if (!participant) {
      return {
        error: 'Invalid participant token',
        status: 404
      };
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

    return {
      success: true,
      slotsCreated: timeSlots.count,
      participant: participant.name,
    };

  } catch (error) {
    // Error logged internally

    if (error instanceof z.ZodError) {
      return {
        error: 'Invalid data format',
        details: error.errors,
        status: 400
      };
    }

    return {
      error: 'Failed to save availability',
      status: 500
    };
  }
}

export function validateAvailabilityData(body: unknown): AvailabilitySubmission | AvailabilityError {
  try {
    return availabilitySchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: 'Invalid data format',
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