import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    // Dynamic imports
    const { prisma } = await import('@/lib/prisma');
    const { verifyToken } = await import('@/lib/auth');
    
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user's events
    const events = await prisma.event.findMany({
      where: {
        creatorId: payload.userId
      },
      include: {
        participants: true,
        _count: {
          select: { participants: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventType: event.eventType,
        availabilityStartDate: event.availabilityStartDate,
        availabilityEndDate: event.availabilityEndDate,
        isFinalized: event.isFinalized,
        participantCount: event._count.participants,
        createdAt: event.createdAt,
        expiresAt: event.expiresAt
      }))
    });

  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}