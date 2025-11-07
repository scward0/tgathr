import { NextResponse } from 'next/server';
import { sendEventConfirmation } from '@/lib/email';
import { sendEventConfirmation as sendEventConfirmationSMS } from '@/lib/sms';

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
      select: {
        id: true,
        name: true,
        shareToken: true,
        finalStartDate: true,
        finalEndDate: true,
        isFinalized: true,
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            smsOptIn: true,
          },
        },
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

    // Send confirmation SMS to all participants who have opted in for SMS
    const smsPromises = updatedEvent.participants
      .filter(participant => participant.smsOptIn && participant.phoneNumber) // Only send to participants with SMS opt-in
      .map(participant =>
        sendEventConfirmationSMS(
          participant.phoneNumber!,
          participant.name,
          updatedEvent.name,
          'Event Organizer',
          updatedEvent.finalStartDate!,
          updatedEvent.finalEndDate!,
          '', // Custom message not used in SMS version
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${updatedEvent.shareToken}`,
          updatedEvent.shareToken // Pass shareToken for calendar download link
        )
      );

    // Wait for all SMS to be sent
    const smsResults = await Promise.allSettled(smsPromises);

    // Log SMS results
    const smsSuccessCount = smsResults.filter(result => result.status === 'fulfilled').length;
    const totalSMS = smsResults.length;

    console.log(`📱 Sent ${smsSuccessCount}/${totalSMS} confirmation SMS messages`);

    // Log any SMS failures (but don't fail the request)
    smsResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send SMS to participant ${index}:`, result.reason);
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
      smsSent: smsSuccessCount,
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