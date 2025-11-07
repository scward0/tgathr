import { NextResponse } from 'next/server';
import { sendEventConfirmation } from '@/lib/email';

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

    // Update the event with finalized dates
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        finalStartDate: new Date(body.finalStartDate),
        finalEndDate: new Date(body.finalEndDate),
        isFinalized: true,
      },
      include: {
        participants: true,
      },
    });

    console.log('📧 Event finalized:', updatedEvent.name);

    // Send confirmation emails to all participants who have email addresses
    const emailPromises = updatedEvent.participants
      .filter(participant => participant.email) // Only send to participants with email
      .map(participant =>
        sendEventConfirmation(
          participant.email!,
          participant.name,
          updatedEvent.name,
          'Event Organizer', // You might want to fetch the actual creator name
          updatedEvent.finalStartDate!,
          updatedEvent.finalEndDate!,
          `Your event "${updatedEvent.name}" has been finalized! Please save the date.`,
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${updatedEvent.id}`,
          updatedEvent.id // Pass event ID for ICS generation
        )
      );

    // Wait for all emails to be sent
    const emailResults = await Promise.allSettled(emailPromises);
    
    // Log email results
    const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
    const totalEmails = emailResults.length;
    
    console.log(`📧 Sent ${successCount}/${totalEmails} confirmation emails`);
    
    // Log any email failures
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send email to participant ${index}:`, result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        isFinalized: updatedEvent.isFinalized,
      },
      emailsSent: successCount,
      totalParticipants: updatedEvent.participants.length,
    });

  } catch (error) {
    console.error('Error finalizing event:', error);
    return NextResponse.json(
      { error: 'Failed to finalize event' },
      { status: 500 }
    );
  }
}