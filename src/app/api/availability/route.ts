import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    // Dynamic imports to avoid build-time issues
    const { z } = await import('zod');
    const { prisma } = await import('@/lib/prisma');

    // Validation schema for availability submission
    const availabilitySchema = z.object({
      eventId: z.string(),
      participantToken: z.string(),
      timeSlots: z.array(z.object({
        startTime: z.string().transform((str) => new Date(str)),
        endTime: z.string().transform((str) => new Date(str)),
      })),
    });

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    // Find the participant by token
    const participant = await prisma.participant.findUnique({
      where: { token: validatedData.participantToken },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid participant token' },
        { status: 404 }
      );
    }

    // Delete existing time slots for this participant/event (in case they're resubmitting)
    await prisma.timeSlot.deleteMany({
      where: {
        eventId: validatedData.eventId,
        participantId: participant.id,
      },
    });

    // Create new time slots
    const timeSlots = await prisma.timeSlot.createMany({
      data: validatedData.timeSlots.map((slot) => ({
        eventId: validatedData.eventId,
        participantId: participant.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });

    console.log(`✅ ${participant.name} submitted ${validatedData.timeSlots.length} time slots for event ${validatedData.eventId}`);

    return NextResponse.json({
      success: true,
      slotsCreated: timeSlots.count,
      participant: participant.name,
    });

  } catch (error) {
    console.error('Error saving availability:', error);
    
    // Import z here for error checking
    const { z } = await import('zod');
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}