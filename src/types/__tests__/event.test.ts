import { eventFormSchema, type EventFormData } from '../event'

describe('Event Form Schema Validation', () => {
  describe('Basic field validation', () => {
    it('should validate a valid single-day event', () => {
      const validSingleDayEvent: EventFormData = {
        name: 'Team Meeting',
        description: 'Monthly team sync',
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(validSingleDayEvent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSingleDayEvent)
      }
    })

    it('should validate a valid multi-day event', () => {
      const validMultiDayEvent: EventFormData = {
        name: 'Team Retreat',
        description: 'Annual company retreat',
        eventType: 'multi-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-30'),
        eventLength: '3-days',
        timingPreference: 'weekends-only',
      }

      const result = eventFormSchema.safeParse(validMultiDayEvent)
      expect(result.success).toBe(true)
    })
  })

  describe('Name validation', () => {
    it('should reject events with names too short', () => {
      const invalidEvent = {
        name: 'AB', // Too short
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 3 characters')
      }
    })

    it('should reject events with names too long', () => {
      const invalidEvent = {
        name: 'A'.repeat(101), // Too long
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('less than 100 characters')
      }
    })

    it('should accept events with valid name lengths', () => {
      const testCases = ['ABC', 'A'.repeat(50), 'A'.repeat(100)]

      testCases.forEach(name => {
        const validEvent = {
          name,
          eventType: 'single-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-20'),
          preferredTime: 'morning',
          duration: '2-hours',
        }

        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Description validation', () => {
    it('should accept events without description', () => {
      const eventWithoutDescription = {
        name: 'Test Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(eventWithoutDescription)
      expect(result.success).toBe(true)
    })

    it('should reject descriptions that are too long', () => {
      const invalidEvent = {
        name: 'Test Event',
        description: 'A'.repeat(501), // Too long
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('less than 500 characters')
      }
    })

    it('should accept valid descriptions', () => {
      const validEvent = {
        name: 'Test Event',
        description: 'A'.repeat(500), // Max length
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })
  })

  describe('Event type validation', () => {
    it('should accept valid event types', () => {
      const validTypes = ['single-day', 'multi-day'] as const

      validTypes.forEach(eventType => {
        const baseEvent = {
          name: 'Test Event',
          eventType,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-20'),
        }

        const event = eventType === 'single-day'
          ? { ...baseEvent, preferredTime: 'morning', duration: '2-hours' }
          : { ...baseEvent, eventLength: '2-days', timingPreference: 'flexible' }

        const result = eventFormSchema.safeParse(event)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid event types', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'invalid-type',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should require event type', () => {
      const invalidEvent = {
        name: 'Test Event',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Please select an event type')
      }
    })
  })

  describe('Date validation', () => {
    it('should require both start and end dates', () => {
      const invalidEvents = [
        {
          name: 'Test Event',
          eventType: 'single-day' as const,
          availabilityEndDate: new Date('2024-01-20'),
          preferredTime: 'morning',
          duration: '2-hours',
        },
        {
          name: 'Test Event',
          eventType: 'single-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          preferredTime: 'morning',
          duration: '2-hours',
        }
      ]

      invalidEvents.forEach(event => {
        const result = eventFormSchema.safeParse(event)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors.some(e =>
            e.message.includes('required') && (e.path.includes('availabilityStartDate') || e.path.includes('availabilityEndDate'))
          )).toBe(true)
        }
      })
    })

    it('should reject end date before start date', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-20'),
        availabilityEndDate: new Date('2024-01-15'), // Before start date
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('End date must be after start date')
      }
    })

    it('should accept same start and end date', () => {
      const validEvent = {
        name: 'Test Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-15'), // Same date
        preferredTime: 'morning',
        duration: '2-hours',
      }

      const result = eventFormSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })
  })

  describe('Single-day event specific validation', () => {
    it('should require preferred time and duration for single-day events', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        // Missing preferredTime and duration
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Please select preferred time and duration')
      }
    })

    it('should reject empty strings for required single-day fields', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: '', // Empty string
        duration: '', // Empty string
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should accept valid preferred time values', () => {
      const validPreferredTimes = ['morning', 'afternoon', 'evening', 'all-day']

      validPreferredTimes.forEach(preferredTime => {
        const validEvent = {
          name: 'Test Event',
          eventType: 'single-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-20'),
          preferredTime,
          duration: '2-hours',
        }

        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid duration values', () => {
      const validDurations = ['1-hour', '2-hours', '3-hours', '4-hours', 'all-day']

      validDurations.forEach(duration => {
        const validEvent = {
          name: 'Test Event',
          eventType: 'single-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-20'),
          preferredTime: 'morning',
          duration,
        }

        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Multi-day event specific validation', () => {
    it('should require event length and timing preference for multi-day events', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'multi-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-30'),
        // Missing eventLength and timingPreference
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Please select event length and timing preference')
      }
    })

    it('should reject empty strings for required multi-day fields', () => {
      const invalidEvent = {
        name: 'Test Event',
        eventType: 'multi-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-30'),
        eventLength: '', // Empty string
        timingPreference: '', // Empty string
      }

      const result = eventFormSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should accept valid event length values', () => {
      const validEventLengths = ['2-days', '3-days', '1-week', '2-weeks']

      validEventLengths.forEach(eventLength => {
        const validEvent = {
          name: 'Test Event',
          eventType: 'multi-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-30'),
          eventLength,
          timingPreference: 'flexible',
        }

        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid timing preference values', () => {
      const validTimingPreferences = ['weekends-only', 'include-weekdays', 'flexible']

      validTimingPreferences.forEach(timingPreference => {
        const validEvent = {
          name: 'Test Event',
          eventType: 'multi-day' as const,
          availabilityStartDate: new Date('2024-01-15'),
          availabilityEndDate: new Date('2024-01-30'),
          eventLength: '2-days',
          timingPreference,
        }

        const result = eventFormSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Schema refinement logic', () => {
    it('should not require single-day fields for multi-day events', () => {
      const validEvent = {
        name: 'Multi-day Event',
        eventType: 'multi-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-30'),
        eventLength: '3-days',
        timingPreference: 'weekends-only',
        // No preferredTime or duration - should be fine for multi-day
      }

      const result = eventFormSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })

    it('should not require multi-day fields for single-day events', () => {
      const validEvent = {
        name: 'Single-day Event',
        eventType: 'single-day' as const,
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'morning',
        duration: '2-hours',
        // No eventLength or timingPreference - should be fine for single-day
      }

      const result = eventFormSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })
  })
})