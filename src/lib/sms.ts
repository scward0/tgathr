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
  
  // Mock mode - just log instead of sending
  console.log(`📱 SMS would be sent to ${participantPhone}:`);
  console.log(`   Message: ${message}`);
  console.log(`   URL: ${availabilityUrl}`);
  
  // Return mock success
  return { 
    success: true, 
    sid: `MOCK_${Date.now()}`,
    message: message,
    url: availabilityUrl 
  };
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
  // Mock mode - just log instead of sending
  console.log(`📱 CONFIRMATION SMS would be sent to ${participantPhone}:`);
  console.log(`   To: ${participantName}`);
  console.log(`   Message: ${customMessage}`);
  console.log(`   Event URL: ${eventDetailsUrl}`);
  
  // Return mock success
  return { 
    success: true, 
    sid: `CONFIRM_${Date.now()}`,
    message: customMessage,
    recipient: participantName
  };
}