import { SchedulingAlgorithm } from '../scheduling-algorithm'
import { createMockEvent, createMockParticipant, createMockTimeSlot } from '../test-setup'

describe('SchedulingAlgorithm', () => {
  describe('Single-day event scheduling', () => {
    it('should find optimal time when all participants are available', () => {
      const event = createMockEvent({
        eventType: 'single-day',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20'),
        preferredTime: 'evening',
        duration: '2-hours'
      })

      const participants = [
        createMockParticipant({
          id: 'participant-1',
          name: 'Alice',
          hasResponded: true,
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T19:00:00Z'),
              endTime: new Date('2024-01-16T22:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        }),
        createMockParticipant({
          id: 'participant-2',
          name: 'Bob',
          hasResponded: true,
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T18:00:00Z'),
              endTime: new Date('2024-01-16T21:00:00Z'),
              participantId: 'participant-2'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].participantCount).toBe(2)
      expect(recommendations[0].availableParticipants).toEqual(['participant-1', 'participant-2'])
      expect(recommendations[0].score).toBeGreaterThan(100) // Base 100% participation + bonuses
    })

    it('should handle overlapping availability with different start times', () => {
      const event = createMockEvent({
        eventType: 'single-day',
        duration: '1-hour'
      })

      const participants = [
        createMockParticipant({
          id: 'participant-1',
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T14:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        }),
        createMockParticipant({
          id: 'participant-2',
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:00:00Z'),
              endTime: new Date('2024-01-16T18:00:00Z'),
              participantId: 'participant-2'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations).toHaveLength(1)
      const recommendation = recommendations[0]
      
      // Should recommend time when both are available (15:00-17:00 overlap)
      expect(recommendation.participantCount).toBe(2)
      expect(recommendation.startTime.getHours()).toBeGreaterThanOrEqual(15)
      expect(recommendation.startTime.getHours()).toBeLessThanOrEqual(16) // 1 hour duration
    })

    it('should prefer times matching preferred time settings', () => {
      const event = createMockEvent({
        eventType: 'single-day',
        preferredTime: 'morning',
        duration: '2-hours'
      })

      const participants = [
        createMockParticipant({
          id: 'participant-1',
          timeSlots: [
            // Morning slot
            createMockTimeSlot({
              startTime: new Date('2024-01-16T09:00:00Z'),
              endTime: new Date('2024-01-16T12:00:00Z'),
              participantId: 'participant-1'
            }),
            // Afternoon slot
            createMockTimeSlot({
              startTime: new Date('2024-01-16T14:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations.length).toBeGreaterThan(0)
      
      // Morning recommendation should have higher score due to preference match
      const morningRec = recommendations.find(r => r.startTime.getHours() >= 8 && r.startTime.getHours() < 12)
      const afternoonRec = recommendations.find(r => r.startTime.getHours() >= 12 && r.startTime.getHours() < 17)
      
      if (morningRec && afternoonRec) {
        expect(morningRec.score).toBeGreaterThan(afternoonRec.score)
      }
    })

    it('should handle no overlapping availability gracefully', () => {
      const event = createMockEvent()
      const participants = [
        createMockParticipant({
          id: 'participant-1',
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T09:00:00Z'),
              endTime: new Date('2024-01-16T11:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        }),
        createMockParticipant({
          id: 'participant-2',
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z'),
              participantId: 'participant-2'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      // Should return individual availability slots when no overlap
      expect(recommendations.length).toBeGreaterThan(0)
      recommendations.forEach(rec => {
        expect(rec.participantCount).toBe(1)
      })
    })

    it('should generate proper reasoning for recommendations', () => {
      const event = createMockEvent({
        preferredTime: 'evening'
      })
      
      const participants = [
        createMockParticipant({
          id: 'participant-1',
          name: 'Alice',
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T19:00:00Z'),
              endTime: new Date('2024-01-16T21:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        }),
        createMockParticipant({
          id: 'participant-2',
          name: 'Bob',
          hasResponded: false // Not responded
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations[0].reasoning).toContain('1/1 participants')
      expect(recommendations[0].reasoning).toContain('100%')
      expect(recommendations[0].reasoning).toContain('evening time')
    })
  })

  describe('Multi-day event scheduling', () => {
    it('should find optimal multi-day periods', () => {
      const event = createMockEvent({
        eventType: 'multi-day',
        eventLength: '2-days',
        availabilityStartDate: new Date('2024-01-15'),
        availabilityEndDate: new Date('2024-01-20')
      })

      const participants = [
        createMockParticipant({
          id: 'participant-1',
          name: 'Alice',
          timeSlots: [
            // Day 1
            createMockTimeSlot({
              startTime: new Date('2024-01-16T08:00:00Z'),
              endTime: new Date('2024-01-16T18:00:00Z'),
              participantId: 'participant-1'
            }),
            // Day 2
            createMockTimeSlot({
              startTime: new Date('2024-01-17T08:00:00Z'),
              endTime: new Date('2024-01-17T18:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        }),
        createMockParticipant({
          id: 'participant-2',
          name: 'Bob',
          timeSlots: [
            // Only Day 1
            createMockTimeSlot({
              startTime: new Date('2024-01-16T09:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z'),
              participantId: 'participant-2'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations.length).toBeGreaterThan(0)
      const bestRecommendation = recommendations[0]
      
      // Should include both participants since both have some availability
      expect(bestRecommendation.participantCount).toBe(2)
      expect(bestRecommendation.reasoning).toContain('2/2 participants')
    })

    it('should calculate proper day coverage for multi-day events', () => {
      const event = createMockEvent({
        eventType: 'multi-day',
        eventLength: '3-days'
      })

      const participants = [
        createMockParticipant({
          id: 'participant-1',
          timeSlots: [
            // Available for 2 out of 3 days
            createMockTimeSlot({
              startTime: new Date('2024-01-16T10:00:00Z'),
              endTime: new Date('2024-01-16T16:00:00Z'),
              participantId: 'participant-1'
            }),
            createMockTimeSlot({
              startTime: new Date('2024-01-17T10:00:00Z'),
              endTime: new Date('2024-01-17T16:00:00Z'),
              participantId: 'participant-1'
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations.length).toBeGreaterThan(0)
      // Should mention day coverage in reasoning
      expect(recommendations[0].reasoning).toContain('67% day coverage') // 2/3 days
    })
  })

  describe('Duration parsing', () => {
    it('should parse duration strings correctly', () => {
      const event = createMockEvent()
      const participants = [createMockParticipant()]
      const algorithm = new SchedulingAlgorithm(event, participants)

      // Test duration parsing through recommendations
      const testCases = [
        { duration: '1-hour', expectedMinutes: 60 },
        { duration: '2-hours', expectedMinutes: 120 },
        { duration: '3-hours', expectedMinutes: 180 },
        { duration: '4-hours', expectedMinutes: 240 },
        { duration: 'all-day', expectedMinutes: 480 }
      ]

      testCases.forEach(({ duration, expectedMinutes }) => {
        const testEvent = createMockEvent({ duration })
        const testAlgorithm = new SchedulingAlgorithm(testEvent, participants)
        
        // This tests the private parseDuration method indirectly
        const recommendations = testAlgorithm.findOptimalTimes()
        if (recommendations.length > 0) {
          const timeDiff = recommendations[0].endTime.getTime() - recommendations[0].startTime.getTime()
          const actualMinutes = timeDiff / (1000 * 60)
          expect(actualMinutes).toBe(expectedMinutes)
        }
      })
    })
  })

  describe('Time preference filtering', () => {
    it('should filter by morning preference', () => {
      const event = createMockEvent({
        preferredTime: 'morning'
      })

      const participants = [
        createMockParticipant({
          timeSlots: [
            // Morning slot
            createMockTimeSlot({
              startTime: new Date('2024-01-16T09:00:00Z'),
              endTime: new Date('2024-01-16T11:00:00Z')
            }),
            // Afternoon slot
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z')
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      // Should prioritize morning times
      const morningRecs = recommendations.filter(r => 
        r.startTime.getHours() >= 8 && r.startTime.getHours() < 12
      )
      const afternoonRecs = recommendations.filter(r => 
        r.startTime.getHours() >= 12 && r.startTime.getHours() < 17
      )

      expect(morningRecs.length).toBeGreaterThan(0)
      if (morningRecs.length > 0 && afternoonRecs.length > 0) {
        expect(morningRecs[0].score).toBeGreaterThan(afternoonRecs[0].score)
      }
    })

    it('should handle all-day preference correctly', () => {
      const event = createMockEvent({
        preferredTime: 'all-day'
      })

      const participants = [
        createMockParticipant({
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T06:00:00Z'),
              endTime: new Date('2024-01-16T22:00:00Z')
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations.length).toBeGreaterThan(0)
      // All-day preference should not filter out any times
      expect(recommendations[0].reasoning).toContain('all-day time')
    })
  })

  describe('Score calculation', () => {
    it('should give bonus points for weekend events', () => {
      const weekendEvent = createMockEvent({
        availabilityStartDate: new Date('2024-01-13'), // Saturday
        availabilityEndDate: new Date('2024-01-14') // Sunday
      })

      const weekdayEvent = createMockEvent({
        availabilityStartDate: new Date('2024-01-15'), // Monday
        availabilityEndDate: new Date('2024-01-16') // Tuesday
      })

      const participants = [
        createMockParticipant({
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-13T15:00:00Z'), // Saturday
              endTime: new Date('2024-01-13T17:00:00Z')
            }),
            createMockTimeSlot({
              startTime: new Date('2024-01-15T15:00:00Z'), // Monday
              endTime: new Date('2024-01-15T17:00:00Z')
            })
          ]
        })
      ]

      const weekendAlgorithm = new SchedulingAlgorithm(weekendEvent, participants)
      const weekdayAlgorithm = new SchedulingAlgorithm(weekdayEvent, participants)

      const weekendRecs = weekendAlgorithm.findOptimalTimes()
      const weekdayRecs = weekdayAlgorithm.findOptimalTimes()

      expect(weekendRecs.length).toBeGreaterThan(0)
      expect(weekdayRecs.length).toBeGreaterThan(0)
      
      // Weekend should have higher score due to weekend bonus
      expect(weekendRecs[0].score).toBeGreaterThan(weekdayRecs[0].score)
    })

    it('should give bonus points for round hours', () => {
      const event = createMockEvent()
      const participants = [
        createMockParticipant({
          timeSlots: [
            // Round hour
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:00:00Z'),
              endTime: new Date('2024-01-16T17:00:00Z')
            }),
            // Half hour
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:30:00Z'),
              endTime: new Date('2024-01-16T17:30:00Z')
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      const roundHourRec = recommendations.find(r => r.startTime.getMinutes() === 0)
      const halfHourRec = recommendations.find(r => r.startTime.getMinutes() === 30)

      if (roundHourRec && halfHourRec) {
        expect(roundHourRec.score).toBeGreaterThan(halfHourRec.score)
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle empty participant list', () => {
      const event = createMockEvent()
      const participants: any[] = []

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations).toEqual([])
    })

    it('should handle participants with no availability', () => {
      const event = createMockEvent()
      const participants = [
        createMockParticipant({
          hasResponded: false,
          timeSlots: []
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      expect(recommendations).toEqual([])
    })

    it('should handle very short durations', () => {
      const event = createMockEvent({
        duration: undefined // Should default to 2 hours
      })

      const participants = [
        createMockParticipant({
          timeSlots: [
            createMockTimeSlot({
              startTime: new Date('2024-01-16T15:00:00Z'),
              endTime: new Date('2024-01-16T15:30:00Z') // Only 30 minutes available
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      // Should not recommend times where duration exceeds availability
      expect(recommendations).toEqual([])
    })

    it('should limit recommendations to reasonable number', () => {
      const event = createMockEvent()
      const participants = [
        createMockParticipant({
          timeSlots: [
            // Very long availability window
            createMockTimeSlot({
              startTime: new Date('2024-01-16T08:00:00Z'),
              endTime: new Date('2024-01-16T20:00:00Z')
            })
          ]
        })
      ]

      const algorithm = new SchedulingAlgorithm(event, participants)
      const recommendations = algorithm.findOptimalTimes()

      // Should limit to max 10 recommendations for single-day events
      expect(recommendations.length).toBeLessThanOrEqual(10)
    })
  })
})