import nodemailer from 'nodemailer';

// Create transporter with Gmail or other email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Check if we're in local development
const isLocalDev = process.env.NODE_ENV === 'development' || 
                  !process.env.EMAIL_USER;

export async function sendEventInvitation(
  participantEmail: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  availabilityUrl: string
) {
  const subject = `${creatorName} invited you to "${eventName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Event Invitation</h2>
      <p>Hi ${participantName},</p>
      <p><strong>${creatorName}</strong> has invited you to participate in the event:</p>
      <h3 style="color: #4A90E2;">${eventName}</h3>
      <p>Please click the link below to submit your availability:</p>
      <a href="${availabilityUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Submit Availability</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${availabilityUrl}">${availabilityUrl}</a></p>
      <p>Thanks!</p>
    </div>
  `;
  
  const text = `${creatorName} invited you to "${eventName}". Submit your availability: ${availabilityUrl}`;
  
  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📧 MOCK EMAIL would be sent to ${participantEmail}:`);
    console.log(`   Subject: ${subject}`);
    console.log(`   URL: ${availabilityUrl}`);
    console.log(`   HTML: ${html}`);
    
    return { 
      success: true, 
      messageId: `MOCK_EMAIL_${Date.now()}`,
      subject: subject,
      url: availabilityUrl 
    };
  }
  
  // Real email for production
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: participantEmail,
      subject: subject,
      text: text,
      html: html,
    });

    console.log(`📧 Email sent to ${participantEmail}: ${result.messageId}`);
    return { 
      success: true, 
      messageId: result.messageId,
      subject: subject,
      url: availabilityUrl 
    };
  } catch (error) {
    console.error(`Failed to send email to ${participantEmail}:`, error);
    return { 
      success: false, 
      error: error,
      subject: subject,
      url: availabilityUrl 
    };
  }
}

export async function sendEventConfirmation(
  participantEmail: string,
  participantName: string,
  eventName: string,
  creatorName: string,
  startDate: Date,
  endDate: Date,
  customMessage: string,
  eventDetailsUrl: string
) {
  const subject = `Event Confirmed: ${eventName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Event Confirmation</h2>
      <p>Hi ${participantName},</p>
      <p><strong>${eventName}</strong> has been confirmed!</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #4A90E2; margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Organizer:</strong> ${creatorName}</p>
        <p><strong>Start:</strong> ${startDate.toLocaleString()}</p>
        <p><strong>End:</strong> ${endDate.toLocaleString()}</p>
      </div>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Message from ${creatorName}:</strong></p>
        <p style="margin: 0;">${customMessage}</p>
      </div>
      <a href="${eventDetailsUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Event Details</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${eventDetailsUrl}">${eventDetailsUrl}</a></p>
      <p>Thanks!</p>
    </div>
  `;

  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📧 MOCK CONFIRMATION EMAIL would be sent to ${participantEmail}:`);
    console.log(`   To: ${participantName}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message: ${customMessage}`);
    console.log(`   Event URL: ${eventDetailsUrl}`);

    return {
      success: true,
      messageId: `CONFIRM_MOCK_EMAIL_${Date.now()}`,
      subject: subject,
      recipient: participantName
    };
  }

  // Real email for production
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: participantEmail,
      subject: subject,
      text: customMessage,
      html: html,
    });

    console.log(`📧 Confirmation email sent to ${participantEmail}: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
      subject: subject,
      recipient: participantName
    };
  } catch (error) {
    console.error(`Failed to send confirmation email to ${participantEmail}:`, error);
    return {
      success: false,
      error: error,
      recipient: participantName
    };
  }
}

export async function sendEventExpirationNotification(
  creatorId: string,
  eventName: string,
  expiresAt: Date,
  totalParticipants: number,
  respondedParticipants: number
) {
  // For now, we'll use a mock email since we don't have creator email lookup
  // In production, you'd fetch the creator's email from the auth system
  const creatorEmail = `creator-${creatorId}@example.com`;

  const subject = `Event Expiring Soon: ${eventName}`;
  const hoursUntilExpiration = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">⚠️ Event Expiring Soon</h2>
      <p>Your event <strong>${eventName}</strong> will expire in approximately ${hoursUntilExpiration} hours.</p>

      <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">Response Status</h3>
        <p><strong>${respondedParticipants}</strong> out of <strong>${totalParticipants}</strong> participants have responded.</p>
        ${respondedParticipants < totalParticipants
          ? `<p style="color: #856404;">⚠️ Not all participants have submitted their availability yet.</p>`
          : `<p style="color: #155724;">✅ All participants have responded!</p>`
        }
      </div>

      <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h3 style="color: #721c24; margin-top: 0;">⏰ Action Required</h3>
        <p>After expiration on <strong>${expiresAt.toLocaleString()}</strong>, this event will be automatically deleted unless you finalize it.</p>
        <p style="margin-bottom: 0;"><strong>To keep this event:</strong> Log in and finalize the event before it expires.</p>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This is an automated notification from tgathr. Finalized events are never automatically deleted.
      </p>
    </div>
  `;

  const text = `Your event "${eventName}" will expire in approximately ${hoursUntilExpiration} hours. ${respondedParticipants} out of ${totalParticipants} participants have responded. After expiration on ${expiresAt.toLocaleString()}, this event will be automatically deleted unless you finalize it.`;

  if (isLocalDev) {
    // Mock mode for local development
    console.log(`📧 MOCK EXPIRATION EMAIL would be sent to creator ${creatorId}:`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Event: ${eventName}`);
    console.log(`   Expires: ${expiresAt.toISOString()}`);
    console.log(`   Responses: ${respondedParticipants}/${totalParticipants}`);

    return {
      success: true,
      messageId: `EXPIRATION_MOCK_EMAIL_${Date.now()}`,
      subject: subject,
      creatorId: creatorId
    };
  }

  // Real email for production
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: creatorEmail,
      subject: subject,
      text: text,
      html: html,
    });

    console.log(`📧 Expiration notification sent for event ${eventName}: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
      subject: subject,
      creatorId: creatorId
    };
  } catch (error) {
    console.error(`Failed to send expiration notification for event ${eventName}:`, error);
    return {
      success: false,
      error: error,
      creatorId: creatorId
    };
  }
}