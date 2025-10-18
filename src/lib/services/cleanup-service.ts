import { prisma } from '@/lib/prisma';
import { sendEventExpirationNotification } from '@/lib/email';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Preview what the cleanup would delete without actually deleting
 * Returns list of events that would be deleted
 */
export async function previewCleanup() {
  const now = new Date();

  const eventsToDelete = await prisma.event.findMany({
    where: {
      expiresAt: { lt: now },
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

  return {
    count: eventsToDelete.length,
    events: eventsToDelete.map(event => ({
      id: event.id,
      name: event.name,
      creatorId: event.creatorId,
      expiresAt: event.expiresAt,
      participantCount: event._count.participants,
      notificationSentAt: event.notificationSentAt
    }))
  };
}

/**
 * Send expiration notifications to event creators for events expiring in 24 hours
 * Returns count of notifications sent
 */
export async function sendExpirationNotifications() {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

  // Find events that:
  // 1. Expire within the next 24 hours
  // 2. Are not finalized
  // 3. Haven't had a notification sent yet
  const eventsNearingExpiration = await prisma.event.findMany({
    where: {
      expiresAt: {
        gte: now,
        lte: twentyFourHoursFromNow
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

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const event of eventsNearingExpiration) {
    try {
      const totalParticipants = event._count.participants;
      const respondedParticipants = event.participants.filter(p => p.timeSlots.length > 0).length;

      const result = await sendEventExpirationNotification(
        event.creatorId,
        event.name,
        event.expiresAt,
        totalParticipants,
        respondedParticipants
      );

      if (result.success) {
        // Mark notification as sent
        await prisma.event.update({
          where: { id: event.id },
          data: { notificationSentAt: now }
        });

        successCount++;
        results.push({
          eventId: event.id,
          eventName: event.name,
          success: true,
          messageId: result.messageId
        });

        console.log(`✅ Sent expiration notification for event ${event.id}: ${event.name}`);
      } else {
        failureCount++;
        results.push({
          eventId: event.id,
          eventName: event.name,
          success: false,
          error: result.error
        });

        console.error(`❌ Failed to send expiration notification for event ${event.id}: ${event.name}`, result.error);
      }
    } catch (error) {
      failureCount++;
      results.push({
        eventId: event.id,
        eventName: event.name,
        success: false,
        error
      });

      console.error(`❌ Error processing expiration notification for event ${event.id}:`, error);
    }
  }

  return {
    total: eventsNearingExpiration.length,
    successCount,
    failureCount,
    results
  };
}

/**
 * Delete expired events that are not finalized
 * Returns count of deleted events and their IDs
 */
export async function deleteExpiredEvents() {
  const now = new Date();

  // Find events that are expired and not finalized
  const eventsToDelete = await prisma.event.findMany({
    where: {
      expiresAt: { lt: now },
      isFinalized: false
    },
    select: {
      id: true,
      name: true,
      expiresAt: true,
      creatorId: true
    }
  });

  const deletedIds: string[] = [];
  const errors: Array<{ eventId: string; error: unknown }> = [];

  for (const event of eventsToDelete) {
    try {
      // Delete event - cascade will handle participants and timeSlots
      await prisma.event.delete({
        where: { id: event.id }
      });

      deletedIds.push(event.id);
      console.log(`🗑️  Deleted expired event ${event.id}: ${event.name}`);
    } catch (error) {
      errors.push({ eventId: event.id, error });
      console.error(`❌ Failed to delete event ${event.id}:`, error);
    }
  }

  return {
    deletedCount: deletedIds.length,
    deletedIds,
    errors,
    events: eventsToDelete
  };
}

/**
 * Main cleanup function that orchestrates both notification and deletion
 * This is the primary entry point for automated cleanup jobs
 */
export async function runCleanup() {
  console.log('🧹 Starting event cleanup process...');

  try {
    // Step 1: Send notifications for events expiring in 24 hours
    console.log('📧 Sending expiration notifications...');
    const notificationResults = await sendExpirationNotifications();
    console.log(`📊 Notifications: ${notificationResults.successCount} sent, ${notificationResults.failureCount} failed`);

    // Step 2: Delete expired events
    console.log('🗑️  Deleting expired events...');
    const deletionResults = await deleteExpiredEvents();
    console.log(`📊 Deleted ${deletionResults.deletedCount} expired events`);

    // Step 3: Return comprehensive results
    const result = {
      success: true,
      timestamp: new Date(),
      notifications: notificationResults,
      deletions: deletionResults
    };

    console.log('✅ Cleanup process completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Cleanup process failed:', error);
    return {
      success: false,
      timestamp: new Date(),
      error
    };
  }
}
