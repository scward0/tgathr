import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
    participantId: string;
  };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { stackServerApp } = await import('@/lib/stack');
    const { prisma } = await import('@/lib/prisma');

    // Get the current user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if event exists and user is the creator
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete participants from events you created' },
        { status: 403 }
      );
    }

    // Check if participant exists and belongs to this event
    const participant = await prisma.participant.findUnique({
      where: { id: params.participantId },
      include: {
        events: {
          where: { id: params.id },
        },
      },
    });

    if (!participant || participant.events.length === 0) {
      return NextResponse.json(
        { error: 'Participant not found for this event' },
        { status: 404 }
      );
    }

    // Delete the participant (this will cascade delete their time slots)
    await prisma.participant.delete({
      where: { id: params.participantId },
    });

    return NextResponse.json({
      success: true,
      message: 'Participant deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    );
  }
}
