/**
 * Unit tests for ICS Generator
 * Tests RFC 5545 compliance and edge cases
 */

import {
  generateICS,
  generateICSBuffer,
  generateICSFilename,
  ICSGenerationParams,
} from '../icsGenerator';

describe('ICS Generator', () => {
  const baseParams: ICSGenerationParams = {
    eventName: 'Team Meeting',
    eventDescription: 'Quarterly planning session',
    startDateTime: new Date('2024-01-18T14:00:00.000Z'),
    endDateTime: new Date('2024-01-18T16:00:00.000Z'),
    organizerEmail: 'organizer@example.com',
    organizerName: 'John Organizer',
    eventId: 'event-123',
  };

  describe('generateICS', () => {
    it('should generate valid ICS structure with all required fields', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//tgathr//Event Scheduler//EN');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should include all required VEVENT properties', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('UID:');
      expect(ics).toContain('DTSTAMP:');
      expect(ics).toContain('DTSTART:');
      expect(ics).toContain('DTEND:');
      expect(ics).toContain('SUMMARY:');
    });

    it('should properly format dates in UTC (YYYYMMDDTHHMMSSZ)', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('DTSTART:20240118T140000Z');
      expect(ics).toContain('DTEND:20240118T160000Z');
    });

    it('should calculate DTEND correctly based on start and end times', () => {
      const params = {
        ...baseParams,
        startDateTime: new Date('2024-01-18T09:00:00.000Z'),
        endDateTime: new Date('2024-01-18T13:00:00.000Z'), // 4 hours later
      };

      const ics = generateICS(params);

      expect(ics).toContain('DTSTART:20240118T090000Z');
      expect(ics).toContain('DTEND:20240118T130000Z');
    });

    it('should generate unique UID using event ID', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('UID:event-event-123@tgathr.app');
    });

    it('should include DTSTAMP with current timestamp', () => {
      const beforeTime = new Date();
      const ics = generateICS(baseParams);
      const afterTime = new Date();

      const dtstampMatch = ics.match(/DTSTAMP:(\d{8}T\d{6}Z)/);
      expect(dtstampMatch).toBeTruthy();

      if (dtstampMatch) {
        const year = parseInt(dtstampMatch[1].substring(0, 4));
        const month = parseInt(dtstampMatch[1].substring(4, 6));
        const day = parseInt(dtstampMatch[1].substring(6, 8));

        expect(year).toBeGreaterThanOrEqual(beforeTime.getUTCFullYear());
        expect(year).toBeLessThanOrEqual(afterTime.getUTCFullYear());
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(31);
      }
    });

    it('should include PRODID', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('PRODID:-//tgathr//Event Scheduler//EN');
    });

    it('should include event name as SUMMARY', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('SUMMARY:Team Meeting');
    });

    it('should include event description as DESCRIPTION', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('DESCRIPTION:Quarterly planning session');
    });

    it('should handle missing optional description field', () => {
      const params = { ...baseParams };
      delete params.eventDescription;

      const ics = generateICS(params);

      expect(ics).not.toContain('DESCRIPTION:');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
    });

    it('should handle missing optional location field', () => {
      const params = { ...baseParams };

      const ics = generateICS(params);

      expect(ics).not.toContain('LOCATION:');
    });

    it('should include location when provided', () => {
      const params = {
        ...baseParams,
        location: 'Conference Room A',
      };

      const ics = generateICS(params);

      expect(ics).toContain('LOCATION:Conference Room A');
    });

    it('should include organizer with name and email', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('ORGANIZER;CN=John Organizer:mailto:organizer@example.com');
    });

    it('should handle organizer without name', () => {
      const params = { ...baseParams };
      delete params.organizerName;

      const ics = generateICS(params);

      expect(ics).toContain('ORGANIZER:mailto:organizer@example.com');
    });

    it('should include standard metadata fields', () => {
      const ics = generateICS(baseParams);

      expect(ics).toContain('SEQUENCE:0');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('TRANSP:OPAQUE');
      expect(ics).toContain('CALSCALE:GREGORIAN');
      expect(ics).toContain('METHOD:PUBLISH');
    });

    it('should handle different duration values correctly', () => {
      const testCases = [
        { duration: 1, end: new Date('2024-01-18T15:00:00.000Z') }, // 1 hour
        { duration: 2, end: new Date('2024-01-18T16:00:00.000Z') }, // 2 hours
        { duration: 4, end: new Date('2024-01-18T18:00:00.000Z') }, // 4 hours
      ];

      testCases.forEach(({ end }) => {
        const params = {
          ...baseParams,
          endDateTime: end,
        };

        const ics = generateICS(params);
        const expectedEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        expect(ics).toContain(`DTEND:${expectedEnd}`);
      });
    });

    describe('special character escaping', () => {
      it('should escape backslashes in event name', () => {
        const params = {
          ...baseParams,
          eventName: 'Meeting \\ Discussion',
        };

        const ics = generateICS(params);

        expect(ics).toContain('SUMMARY:Meeting \\\\ Discussion');
      });

      it('should escape semicolons in event name', () => {
        const params = {
          ...baseParams,
          eventName: 'Meeting; Team Discussion',
        };

        const ics = generateICS(params);

        expect(ics).toContain('SUMMARY:Meeting\\; Team Discussion');
      });

      it('should escape commas in event name', () => {
        const params = {
          ...baseParams,
          eventName: 'Meeting, Team Discussion',
        };

        const ics = generateICS(params);

        expect(ics).toContain('SUMMARY:Meeting\\, Team Discussion');
      });

      it('should escape newlines in description', () => {
        const params = {
          ...baseParams,
          eventDescription: 'Line 1\nLine 2\nLine 3',
        };

        const ics = generateICS(params);

        expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\\nLine 3');
      });

      it('should handle multiple special characters together', () => {
        const params = {
          ...baseParams,
          eventName: 'Meeting\\; Discussion, Part 1\nPart 2',
        };

        const ics = generateICS(params);

        expect(ics).toContain('SUMMARY:Meeting\\\\\\; Discussion\\, Part 1\\nPart 2');
      });

      it('should escape special characters in location', () => {
        const params = {
          ...baseParams,
          location: 'Room A; Building B, Floor 3',
        };

        const ics = generateICS(params);

        expect(ics).toContain('LOCATION:Room A\\; Building B\\, Floor 3');
      });
    });

    describe('line folding', () => {
      it('should fold long lines at 75 characters', () => {
        const longDescription = 'A'.repeat(100);
        const params = {
          ...baseParams,
          eventDescription: longDescription,
        };

        const ics = generateICS(params);
        const lines = ics.split('\r\n');

        lines.forEach(line => {
          expect(line.length).toBeLessThanOrEqual(75);
        });
      });

      it('should continue folded lines with leading space', () => {
        const longDescription = 'A'.repeat(100);
        const params = {
          ...baseParams,
          eventDescription: longDescription,
        };

        const ics = generateICS(params);
        const lines = ics.split('\r\n');

        // Find the description line
        const descIndex = lines.findIndex(line => line.startsWith('DESCRIPTION:'));
        expect(descIndex).toBeGreaterThan(-1);

        // Check if the next line (if exists and is continuation) starts with space
        if (descIndex < lines.length - 1 && lines[descIndex + 1].startsWith(' ')) {
          expect(lines[descIndex + 1].charAt(0)).toBe(' ');
        }
      });

      it('should not fold short lines', () => {
        const ics = generateICS(baseParams);
        const lines = ics.split('\r\n');

        // Most standard lines should not be folded
        const summaryLine = lines.find(line => line.startsWith('SUMMARY:'));
        expect(summaryLine).toBeDefined();
        expect(summaryLine!.length).toBeLessThan(75);
      });
    });

    describe('multi-line descriptions', () => {
      it('should handle multi-paragraph descriptions correctly', () => {
        const params = {
          ...baseParams,
          eventDescription: 'Paragraph 1\n\nParagraph 2\n\nParagraph 3',
        };

        const ics = generateICS(params);

        expect(ics).toContain('DESCRIPTION:Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3');
      });

      it('should handle empty lines in descriptions', () => {
        const params = {
          ...baseParams,
          eventDescription: 'Line 1\n\n\nLine 2',
        };

        const ics = generateICS(params);

        expect(ics).toContain('DESCRIPTION:Line 1\\n\\n\\nLine 2');
      });
    });

    describe('attendees', () => {
      it('should include attendees when provided', () => {
        const params = {
          ...baseParams,
          attendeeEmails: ['alice@example.com', 'bob@example.com'],
        };

        const ics = generateICS(params);

        expect(ics).toContain('ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:alice@example.com');
        expect(ics).toContain('ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:bob@example.com');
      });

      it('should handle empty attendee list', () => {
        const params = {
          ...baseParams,
          attendeeEmails: [],
        };

        const ics = generateICS(params);

        expect(ics).not.toContain('ATTENDEE:');
      });

      it('should handle missing attendeeEmails field', () => {
        const params = { ...baseParams };

        const ics = generateICS(params);

        expect(ics).not.toContain('ATTENDEE:');
      });
    });

    describe('edge cases', () => {
      it('should handle events with same start and end time', () => {
        const params = {
          ...baseParams,
          startDateTime: new Date('2024-01-18T14:00:00.000Z'),
          endDateTime: new Date('2024-01-18T14:00:00.000Z'),
        };

        const ics = generateICS(params);

        expect(ics).toContain('DTSTART:20240118T140000Z');
        expect(ics).toContain('DTEND:20240118T140000Z');
      });

      it('should handle events spanning midnight', () => {
        const params = {
          ...baseParams,
          startDateTime: new Date('2024-01-18T23:00:00.000Z'),
          endDateTime: new Date('2024-01-19T01:00:00.000Z'),
        };

        const ics = generateICS(params);

        expect(ics).toContain('DTSTART:20240118T230000Z');
        expect(ics).toContain('DTEND:20240119T010000Z');
      });

      it('should handle events spanning year boundary', () => {
        const params = {
          ...baseParams,
          startDateTime: new Date('2024-12-31T23:00:00.000Z'),
          endDateTime: new Date('2025-01-01T02:00:00.000Z'),
        };

        const ics = generateICS(params);

        expect(ics).toContain('DTSTART:20241231T230000Z');
        expect(ics).toContain('DTEND:20250101T020000Z');
      });

      it('should handle empty event name gracefully', () => {
        const params = {
          ...baseParams,
          eventName: '',
        };

        const ics = generateICS(params);

        expect(ics).toContain('SUMMARY:');
      });

      it('should end with CRLF', () => {
        const ics = generateICS(baseParams);

        expect(ics.endsWith('\r\n')).toBe(true);
      });

      it('should use CRLF line endings throughout', () => {
        const ics = generateICS(baseParams);

        // Should not contain standalone \n
        expect(ics.split('\n').length).toBe(ics.split('\r\n').length);
      });
    });
  });

  describe('generateICSBuffer', () => {
    it('should return a Buffer', () => {
      const buffer = generateICSBuffer(baseParams);

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should contain valid UTF-8 encoded ICS content', () => {
      const buffer = generateICSBuffer(baseParams);
      const content = buffer.toString('utf-8');

      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('END:VCALENDAR');
    });

    it('should produce same content as generateICS', () => {
      const icsString = generateICS(baseParams);
      const buffer = generateICSBuffer(baseParams);
      const bufferString = buffer.toString('utf-8');

      expect(bufferString).toBe(icsString);
    });
  });

  describe('generateICSFilename', () => {
    it('should generate safe filename from event name', () => {
      const filename = generateICSFilename('Team Meeting');

      expect(filename).toBe('Team-Meeting.ics');
    });

    it('should remove special characters', () => {
      const filename = generateICSFilename('Team Meeting @ 2pm!');

      expect(filename).toBe('Team-Meeting-2pm.ics');
    });

    it('should replace spaces with hyphens', () => {
      const filename = generateICSFilename('Quarterly Planning Session');

      expect(filename).toBe('Quarterly-Planning-Session.ics');
    });

    it('should limit filename length to 50 characters', () => {
      const longName = 'A'.repeat(100);
      const filename = generateICSFilename(longName);

      expect(filename.length).toBeLessThanOrEqual(54); // 50 chars + '.ics'
      expect(filename).toBe('A'.repeat(50) + '.ics');
    });

    it('should handle empty event name', () => {
      const filename = generateICSFilename('');

      expect(filename).toBe('event.ics');
    });

    it('should handle event name with only special characters', () => {
      const filename = generateICSFilename('@@##$$%%');

      expect(filename).toBe('event.ics');
    });

    it('should handle multiple consecutive spaces', () => {
      const filename = generateICSFilename('Team    Meeting');

      expect(filename).toBe('Team-Meeting.ics');
    });
  });
});
