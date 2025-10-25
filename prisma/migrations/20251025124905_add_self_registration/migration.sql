-- AlterTable: Add shareToken to Event for self-registration
-- This is the single shareable link for the entire event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

-- Generate unique shareToken for existing events (using cuid format)
-- In production, you may want to use a proper cuid() function
UPDATE "Event" SET "shareToken" = 'evt_' || substr(md5(random()::text || id), 1, 24)
WHERE "shareToken" IS NULL;

-- Make shareToken required and unique
ALTER TABLE "Event" ALTER COLUMN "shareToken" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Event_shareToken_key" ON "Event"("shareToken");
CREATE INDEX IF NOT EXISTS "Event_shareToken_idx" ON "Event"("shareToken");

-- Add notificationSentAt if it doesn't exist (from schema sync)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "notificationSentAt" TIMESTAMP(3);

-- AlterTable: Add SMS opt-in fields to Participant for A2P 10DLC compliance
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "smsOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "smsOptInAt" TIMESTAMP(3);

-- Add email field if it doesn't exist (from schema sync)
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "email" TEXT;
CREATE INDEX IF NOT EXISTS "Participant_email_idx" ON "Participant"("email");

-- Make phoneNumber optional (participants can register without SMS)
ALTER TABLE "Participant" ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- Drop the unique constraint on (phoneNumber, token) since phoneNumber is now optional
DROP INDEX IF EXISTS "Participant_phoneNumber_token_key";

-- Note: Existing participants will have smsOptIn=false by default (conservative approach)
-- This ensures compliance - only new registrations with explicit opt-in will receive SMS
