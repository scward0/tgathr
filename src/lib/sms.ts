import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Check if we're in local development
const isLocalDev = process.env.NODE_ENV === 'development' || 
                  process.env.TWILIO_ACCOUNT_SID === 'test_sid';

export async function sendEventInvitation(
  participantPhone: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  availabilityUrl: string
) {
  const message = `${creatorName} invited you to "${eventName}". Submit your availability: ${availabilityUrl}`;
  
  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📱 MOCK SMS would be sent to ${participantPhone}:`);
    console.log(`   Message: ${message}`);
    console.log(`   URL: ${availabilityUrl}`);
    
    return { 
      success: true, 
      sid: `MOCK_${Date.now()}`,
      message: message,
      url: availabilityUrl 
    };
  }
  
  // Real SMS for production
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: participantPhone,
    });

    console.log(`📱 SMS sent to ${participantPhone}: ${result.sid}`);
    return { 
      success: true, 
      sid: result.sid,
      message: message,
      url: availabilityUrl 
    };
  } catch (error) {
    console.error(`Failed to send SMS to ${participantPhone}:`, error);
    return { 
      success: false, 
      error: error,
      message: message,
      url: availabilityUrl 
    };
  }
}

/**
 * Send SMS opt-in confirmation message
 * This is sent immediately when a participant opts in to SMS notifications
 * Includes "Reply STOP to opt out" for A2P 10DLC compliance
 */
export async function sendSMSOptInConfirmation(
  participantPhone: string,
  participantName: string,
  eventName: string
) {
  const message = `Thanks ${participantName}! You're registered for "${eventName}". We'll text you when the date is finalized. Reply STOP to opt out.`;

  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📱 MOCK OPT-IN SMS would be sent to ${participantPhone}:`);
    console.log(`   Message: ${message}`);

    return {
      success: true,
      sid: `OPTIN_MOCK_${Date.now()}`,
      message: message
    };
  }

  // Real SMS for production
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: participantPhone,
    });

    console.log(`📱 Opt-in confirmation SMS sent to ${participantPhone}: ${result.sid}`);
    return {
      success: true,
      sid: result.sid,
      message: message
    };
  } catch (error) {
    console.error(`Failed to send opt-in SMS to ${participantPhone}:`, error);
    throw error; // Throw to let caller handle
  }
}

export async function sendEventConfirmation(
  participantPhone: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  startDate: Date,
  endDate: Date,
  customMessage: string,
  eventDetailsUrl: string,
  shareToken?: string
) {
  // Format date for SMS (compact format)
  const dateStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Build calendar download URL if shareToken provided
  const calendarUrl = shareToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/events/${shareToken}/calendar`
    : null;

  // Construct SMS message with calendar link
  const message = calendarUrl
    ? `${eventName} confirmed! 📅 ${dateStr} at ${timeStr}. Add to calendar: ${calendarUrl} View details: ${eventDetailsUrl} Reply STOP to opt out.`
    : `${eventName} confirmed! 📅 ${dateStr} at ${timeStr}. View details: ${eventDetailsUrl} Reply STOP to opt out.`;

  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📱 MOCK CONFIRMATION SMS would be sent to ${participantPhone}:`);
    console.log(`   To: ${participantName}`);
    console.log(`   Message: ${message}`);
    console.log(`   Event URL: ${eventDetailsUrl}`);
    console.log(`   Calendar URL: ${calendarUrl || 'N/A'}`);

    return {
      success: true,
      sid: `CONFIRM_MOCK_${Date.now()}`,
      message: message,
      recipient: participantName
    };
  }

  // Real SMS for production
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: participantPhone,
    });

    console.log(`📱 Confirmation SMS sent to ${participantPhone}: ${result.sid}`);
    return {
      success: true,
      sid: result.sid,
      message: message,
      recipient: participantName
    };
  } catch (error) {
    console.error(`Failed to send confirmation SMS to ${participantPhone}:`, error);
    return {
      success: false,
      error: error,
      recipient: participantName
    };
  }
}

/**
 * Send event notifications to all opted-in participants
 * A2P 10DLC COMPLIANCE: Only sends to participants with smsOptIn = true
 */
export async function sendEventNotificationToOptedIn(
  eventId: string,
  message: string
) {
  const { prisma } = await import('@/lib/prisma');

  // Get all participants who opted in to SMS for this event
  const participants = await prisma.participant.findMany({
    where: {
      events: {
        some: {
          id: eventId,
        },
      },
      smsOptIn: true, // CRITICAL: Only send to opted-in users
      phoneNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
    },
  });

  if (participants.length === 0) {
    console.log(`No opted-in participants for event ${eventId}`);
    return { sent: 0, failed: 0, results: [] };
  }

  const results = await Promise.allSettled(
    participants.map(async (participant) => {
      if (!participant.phoneNumber) {
        return null;
      }

      if (isLocalDev) {
        console.log(`📱 MOCK SMS to ${participant.name} (${participant.phoneNumber}): ${message}`);
        return {
          participantId: participant.id,
          success: true,
          sid: `MOCK_${Date.now()}`,
        };
      }

      try {
        const result = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: participant.phoneNumber,
        });

        console.log(`📱 SMS sent to ${participant.phoneNumber}: ${result.sid}`);
        return {
          participantId: participant.id,
          success: true,
          sid: result.sid,
        };
      } catch (error) {
        console.error(`Failed to send SMS to ${participant.phoneNumber}:`, error);
        return {
          participantId: participant.id,
          success: false,
          error,
        };
      }
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  const failed = results.length - successful;

  return {
    sent: successful,
    failed,
    results,
  };
}