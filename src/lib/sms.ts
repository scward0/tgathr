import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendEventInvitation(
  participantPhone: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  availabilityUrl: string
) {
  const message = `${creatorName} invited you to "${eventName}". Submit your availability: ${availabilityUrl}`;
  
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

export async function sendEventConfirmation(
  participantPhone: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  startDate: Date,
  endDate: Date,
  customMessage: string,
  eventDetailsUrl: string
) {
  try {
    const result = await client.messages.create({
      body: customMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: participantPhone,
    });

    console.log(`📱 Confirmation SMS sent to ${participantPhone}: ${result.sid}`);
    return { 
      success: true, 
      sid: result.sid,
      message: customMessage,
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