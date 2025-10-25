import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: {
    shareToken: string;
  };
}

// Validation schema for participant registration
const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phoneNumber: z.string().optional(),
  smsOptIn: z.boolean().default(false),
});

export async function POST(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const body = await request.json();

    // Validate request body
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, phoneNumber, smsOptIn } = validationResult.data;

    // Validate SMS opt-in requirement
    if (smsOptIn && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required when opting in to SMS notifications' },
        { status: 400 }
      );
    }

    // Find event by shareToken
    const event = await prisma.event.findUnique({
      where: { shareToken: params.shareToken },
      select: {
        id: true,
        name: true,
        isFinalized: true,
        expiresAt: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is still accepting registrations
    if (event.isFinalized) {
      return NextResponse.json(
        { error: 'This event has already been finalized' },
        { status: 400 }
      );
    }

    if (new Date() > event.expiresAt) {
      return NextResponse.json(
        { error: 'This event has expired' },
        { status: 400 }
      );
    }

    // Create participant with unique token
    const participantToken = randomUUID();
    const participant = await prisma.participant.create({
      data: {
        name,
        phoneNumber: phoneNumber || null,
        token: participantToken,
        smsOptIn,
        smsOptInAt: smsOptIn ? new Date() : null,
        events: {
          connect: { id: event.id },
        },
      },
    });

    // Send SMS confirmation if opted in
    if (smsOptIn && phoneNumber) {
      try {
        const { sendSMSOptInConfirmation } = await import('@/lib/sms');
        await sendSMSOptInConfirmation(
          phoneNumber,
          name,
          event.name
        );
      } catch (smsError) {
        // Log error but don't fail registration
        console.error('Failed to send SMS confirmation:', smsError);
      }
    }

    return NextResponse.json({
      participantId: participant.id,
      editToken: participant.token,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Error in registration route:', error);
    return NextResponse.json(
      { error: 'Failed to register participant' },
      { status: 500 }
    );
  }
}
