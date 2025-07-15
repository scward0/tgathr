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