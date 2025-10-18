import {
  previewCleanup,
  sendExpirationNotifications,
  deleteExpiredEvents,
  runCleanup
} from '../cleanup-service';
import { prisma } from '@/lib/prisma';
import { sendEventExpirationNotification } from '@/lib/email';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendEventExpirationNotification: jest.fn(),
}));

describe('Cleanup Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now to a fixed time for consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('previewCleanup', () => {
    it('should return list of events that would be deleted', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Expired Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-10T12:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [],
          _count: { participants: 5 }
        },
        {
          id: 'event-2',
          name: 'Expired Event 2',
          creatorId: 'user-2',
          expiresAt: new Date('2024-01-12T12:00:00Z'),
          isFinalized: false,
          notificationSentAt: new Date('2024-01-11T12:00:00Z'),
          participants: [],
          _count: { participants: 3 }
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);

      const result = await previewCleanup();

      expect(result.count).toBe(2);
      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toEqual({
        id: 'event-1',
        name: 'Expired Event 1',
        creatorId: 'user-1',
        expiresAt: expect.any(Date),
        participantCount: 5,
        notificationSentAt: null
      });

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          isFinalized: false
        },
        include: {
          participants: {
            include: {
              timeSlots: true
            }
          },
          _count: {
            select: { participants: true }
          }
        },
        orderBy: {
          expiresAt: 'asc'
        }
      });
    });

    it('should return empty list when no expired events', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await previewCleanup();

      expect(result.count).toBe(0);
      expect(result.events).toHaveLength(0);
    });

    it('should exclude finalized events from preview', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce([]);

      await previewCleanup();

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFinalized: false
          })
        })
      );
    });
  });

  describe('sendExpirationNotifications', () => {
    it('should send notifications for events expiring in 24 hours', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Soon to Expire Event',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'), // 23 hours from now
          isFinalized: false,
          notificationSentAt: null,
          participants: [
            { id: 'p1', timeSlots: [{ id: 'ts1' }] },
            { id: 'p2', timeSlots: [] }
          ],
          _count: { participants: 2 }
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });
      (prisma.event.update as jest.Mock).mockResolvedValueOnce({});

      const result = await sendExpirationNotifications();

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
      expect(result.results[0]).toEqual({
        eventId: 'event-1',
        eventName: 'Soon to Expire Event',
        success: true,
        messageId: 'msg-123'
      });

      expect(sendEventExpirationNotification).toHaveBeenCalledWith(
        'user-1',
        'Soon to Expire Event',
        mockEvents[0].expiresAt,
        2,
        1
      );

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { notificationSentAt: expect.any(Date) }
      });
    });

    it('should not send notifications for events that already have notifications sent', async () => {
      const mockEvents: never[] = [];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);

      const result = await sendExpirationNotifications();

      expect(result.total).toBe(0);
      expect(sendEventExpirationNotification).not.toHaveBeenCalled();
    });

    it('should handle email sending failures', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [],
          _count: { participants: 0 }
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Email service unavailable'
      });

      const result = await sendExpirationNotifications();

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(prisma.event.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [],
          _count: { participants: 0 }
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });
      (prisma.event.update as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await sendExpirationNotifications();

      expect(result.total).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.results[0].success).toBe(false);
    });

    it('should calculate correct response count', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event with Responses',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [
            { id: 'p1', timeSlots: [{ id: 'ts1' }] },
            { id: 'p2', timeSlots: [{ id: 'ts2' }] },
            { id: 'p3', timeSlots: [] },
            { id: 'p4', timeSlots: [] }
          ],
          _count: { participants: 4 }
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });
      (prisma.event.update as jest.Mock).mockResolvedValueOnce({});

      await sendExpirationNotifications();

      expect(sendEventExpirationNotification).toHaveBeenCalledWith(
        'user-1',
        'Event with Responses',
        expect.any(Date),
        4,
        2
      );
    });

    it('should only find events expiring within next 24 hours', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce([]);

      await sendExpirationNotifications();

      const expectedNow = new Date('2024-01-15T12:00:00Z');
      const expectedTwentyFourHoursLater = new Date('2024-01-16T12:00:00Z');

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            gte: expectedNow,
            lte: expectedTwentyFourHoursLater
          },
          isFinalized: false,
          notificationSentAt: null
        },
        include: {
          participants: {
            include: {
              timeSlots: true
            }
          },
          _count: {
            select: { participants: true }
          }
        }
      });
    });
  });

  describe('deleteExpiredEvents', () => {
    it('should delete expired events successfully', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Expired Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-10T12:00:00Z')
        },
        {
          id: 'event-2',
          name: 'Expired Event 2',
          creatorId: 'user-2',
          expiresAt: new Date('2024-01-12T12:00:00Z')
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (prisma.event.delete as jest.Mock).mockResolvedValue({});

      const result = await deleteExpiredEvents();

      expect(result.deletedCount).toBe(2);
      expect(result.deletedIds).toEqual(['event-1', 'event-2']);
      expect(result.errors).toHaveLength(0);

      expect(prisma.event.delete).toHaveBeenCalledTimes(2);
      expect(prisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' }
      });
      expect(prisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-2' }
      });
    });

    it('should return empty result when no expired events', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await deleteExpiredEvents();

      expect(result.deletedCount).toBe(0);
      expect(result.deletedIds).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.event.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-10T12:00:00Z')
        },
        {
          id: 'event-2',
          name: 'Event 2',
          creatorId: 'user-2',
          expiresAt: new Date('2024-01-11T12:00:00Z')
        }
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce(mockEvents);
      (prisma.event.delete as jest.Mock)
        .mockResolvedValueOnce({}) // First deletion succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Second fails

      const result = await deleteExpiredEvents();

      expect(result.deletedCount).toBe(1);
      expect(result.deletedIds).toEqual(['event-1']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        eventId: 'event-2',
        error: expect.any(Error)
      });
    });

    it('should only query for expired non-finalized events', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValueOnce([]);

      await deleteExpiredEvents();

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          isFinalized: false
        },
        select: {
          id: true,
          name: true,
          expiresAt: true,
          creatorId: true
        }
      });
    });
  });

  describe('runCleanup', () => {
    it('should run full cleanup process successfully', async () => {
      // Mock notifications
      const mockNotificationEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [],
          _count: { participants: 0 }
        }
      ];

      // Mock deletions
      const mockExpiredEvents = [
        {
          id: 'event-old',
          name: 'Old Event',
          creatorId: 'user-2',
          expiresAt: new Date('2024-01-10T12:00:00Z')
        }
      ];

      (prisma.event.findMany as jest.Mock)
        .mockResolvedValueOnce(mockNotificationEvents) // First call for notifications
        .mockResolvedValueOnce(mockExpiredEvents); // Second call for deletions

      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });
      (prisma.event.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.event.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await runCleanup();

      expect(result.success).toBe(true);
      expect(result.notifications.successCount).toBe(1);
      expect(result.notifications.failureCount).toBe(0);
      expect(result.deletions.deletedCount).toBe(1);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle errors in cleanup process', async () => {
      (prisma.event.findMany as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await runCleanup();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should complete even if notifications fail', async () => {
      const mockNotificationEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          creatorId: 'user-1',
          expiresAt: new Date('2024-01-16T11:00:00Z'),
          isFinalized: false,
          notificationSentAt: null,
          participants: [],
          _count: { participants: 0 }
        }
      ];

      const mockExpiredEvents = [
        {
          id: 'event-old',
          name: 'Old Event',
          creatorId: 'user-2',
          expiresAt: new Date('2024-01-10T12:00:00Z')
        }
      ];

      (prisma.event.findMany as jest.Mock)
        .mockResolvedValueOnce(mockNotificationEvents)
        .mockResolvedValueOnce(mockExpiredEvents);

      (sendEventExpirationNotification as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Email service down'
      });
      (prisma.event.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await runCleanup();

      expect(result.success).toBe(true);
      expect(result.notifications.failureCount).toBe(1);
      expect(result.deletions.deletedCount).toBe(1);
    });
  });
});
