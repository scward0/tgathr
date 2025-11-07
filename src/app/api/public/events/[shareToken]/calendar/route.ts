/**
 * Calendar Export API Route
 * GET /api/events/[shareToken]/calendar
 *
 * Generates and downloads an ICS file for a finalized event
 */

import { NextResponse } from 'next/server';
import { generateICS, generateICSFilename } from '@/lib/calendar/icsGenerator';

interface RouteParams {
  params: {
    shareToken: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not available during build' },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Fetch event with shareToken
    const event = await prisma.event.findUnique({
      where: { shareToken: params.shareToken },
      select: {
        id: true,
        name: true,
        description: true,
        finalStartDate: true,
        finalEndDate: true,
        isFinalized: true,
      },
    });

    // Validate event exists
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate event is finalized
    if (!event.isFinalized || !event.finalStartDate || !event.finalEndDate) {
      return NextResponse.json(
        { error: 'Event is not finalized yet' },
        { status: 400 }
      );
    }

    // Generate ICS file content
    const icsContent = generateICS({
      eventName: event.name,
      eventDescription: event.description || undefined,
      startDateTime: event.finalStartDate,
      endDateTime: event.finalEndDate,
      eventId: event.id,
      // Creator and attendee information would be fetched separately if needed
      // For now, omitting to keep the implementation simple
    });

    // Generate safe filename
    const filename = generateICSFilename(event.name);

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error generating calendar file:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
