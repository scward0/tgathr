import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    
    const body = await request.json();
    console.log('Finalize request received:', body);

    // Simple test - just mark as finalized for now
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        finalStartDate: new Date(body.finalStartDate),
        finalEndDate: new Date(body.finalEndDate),
        isFinalized: true,
      },
    });

    console.log('📧 Event finalized:', updatedEvent.name);

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        isFinalized: updatedEvent.isFinalized,
      },
    });

  } catch (error) {
    console.error('Error finalizing event:', error);
    return NextResponse.json(
      { error: 'Failed to finalize event' },
      { status: 500 }
    );
  }
}