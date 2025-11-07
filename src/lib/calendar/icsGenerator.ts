/**
 * ICS (iCalendar) File Generator
 * Generates RFC 5545 compliant .ics files for calendar integration
 */

export interface ICSGenerationParams {
  eventName: string;
  eventDescription?: string;
  startDateTime: Date;
  endDateTime: Date;
  organizerEmail?: string;
  organizerName?: string;
  eventId: string;
  location?: string;
  attendeeEmails?: string[];
}

/**
 * Formats a Date object to ICS datetime format (YYYYMMDDTHHMMSSZ in UTC)
 * @param date - The date to format
 * @returns Formatted date string in ICS format
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in ICS text fields according to RFC 5545
 * Escapes: backslash (\), semicolon (;), comma (,), newline (\n)
 * @param text - The text to escape
 * @returns Escaped text safe for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Backslash must be escaped first
    .replace(/;/g, '\\;')     // Semicolon
    .replace(/,/g, '\\,')     // Comma
    .replace(/\n/g, '\\n')    // Newline
    .replace(/\r/g, '');      // Remove carriage returns
}

/**
 * Folds long lines to meet RFC 5545 75-character limit
 * Long lines are broken with CRLF followed by a space
 * @param line - The line to fold
 * @returns Folded line with proper line breaks
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const lines: string[] = [];
  let currentLine = line;

  while (currentLine.length > 75) {
    lines.push(currentLine.substring(0, 75));
    currentLine = ' ' + currentLine.substring(75); // Continuation lines start with space
  }

  lines.push(currentLine);
  return lines.join('\r\n');
}

/**
 * Generates a unique UID for the calendar event
 * Format: event-{eventId}@tgathr.app
 * @param eventId - The event ID
 * @returns Unique event identifier
 */
function generateUID(eventId: string): string {
  return `event-${eventId}@tgathr.app`;
}

/**
 * Generates an RFC 5545 compliant ICS file content
 * @param params - Event parameters for ICS generation
 * @returns ICS file content as a string
 */
export function generateICS(params: ICSGenerationParams): string {
  const {
    eventName,
    eventDescription,
    startDateTime,
    endDateTime,
    organizerEmail,
    organizerName,
    eventId,
    location,
    attendeeEmails = [],
  } = params;

  // Generate timestamps
  const dtstart = formatICSDate(startDateTime);
  const dtend = formatICSDate(endDateTime);
  const dtstamp = formatICSDate(new Date()); // Current timestamp
  const uid = generateUID(eventId);

  // Escape text fields
  const summary = escapeICSText(eventName);
  const description = eventDescription ? escapeICSText(eventDescription) : '';
  const loc = location ? escapeICSText(location) : '';

  // Build ICS content
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tgathr//Event Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ];

  // Add optional fields
  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  if (loc) {
    lines.push(`LOCATION:${loc}`);
  }

  if (organizerEmail) {
    const organizerLine = organizerName
      ? `ORGANIZER;CN=${escapeICSText(organizerName)}:mailto:${organizerEmail}`
      : `ORGANIZER:mailto:${organizerEmail}`;
    lines.push(organizerLine);
  }

  // Add attendees
  attendeeEmails.forEach(email => {
    lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${email}`);
  });

  // Add standard fields
  lines.push('SEQUENCE:0');
  lines.push('STATUS:CONFIRMED');
  lines.push('TRANSP:OPAQUE');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  // Fold long lines and join with CRLF
  const foldedLines = lines.map(line => foldLine(line));
  return foldedLines.join('\r\n') + '\r\n';
}

/**
 * Generates an ICS file as a Buffer for download or email attachment
 * @param params - Event parameters for ICS generation
 * @returns Buffer containing ICS file content
 */
export function generateICSBuffer(params: ICSGenerationParams): Buffer {
  const icsContent = generateICS(params);
  return Buffer.from(icsContent, 'utf-8');
}

/**
 * Generates a safe filename for the ICS file
 * Removes special characters and limits length
 * @param eventName - The event name
 * @returns Safe filename
 */
export function generateICSFilename(eventName: string): string {
  const safeName = eventName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .substring(0, 50);                // Limit length

  return `${safeName || 'event'}.ics`;
}
