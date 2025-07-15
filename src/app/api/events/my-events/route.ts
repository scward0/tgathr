import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    // Dynamic imports
    const { prisma } = await import('@/lib/prisma');
    
    // Check authentication with Neon Auth
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's events
    const events = await prisma.event.findMany({
      where: {
        creatorId: user.id
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