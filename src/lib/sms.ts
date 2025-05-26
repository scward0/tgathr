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
  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📱 MOCK CONFIRMATION SMS would be sent to ${participantPhone}:`);
    console.log(`   To: ${participantName}`);
    console.log(`   Message: ${customMessage}`);
    console.log(`   Event URL: ${eventDetailsUrl}`);
    
    return { 
      success: true, 
      sid: `CONFIRM_MOCK_${Date.now()}`,
      message: customMessage,
      recipient: participantName
    };
  }

  // Real SMS for production
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