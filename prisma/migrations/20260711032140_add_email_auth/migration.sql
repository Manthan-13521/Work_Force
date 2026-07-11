-- Add email authentication fields to User model
-- This migration adds email (unique, required) and emailVerified fields
-- while preserving existing phone data as optional contact information.

-- Add email column (initially nullable for existing users)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Add emailVerified column with default false
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Backfill email for existing users that don't have one
-- Uses a deterministic placeholder based on user ID
UPDATE "User" SET "email" = CONCAT('user_', id, '@backfill.workforce.in') WHERE "email" IS NULL;

-- Make email NOT NULL and add unique constraint
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Drop unique index on phone if it exists (phone is now optional contact info)
DROP INDEX IF EXISTS "User_phone_key";

-- Ensure existing indexes remain valid
-- Role index
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
-- Status index
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
-- City index
CREATE INDEX IF NOT EXISTS "User_city_idx" ON "User"("city");
-- Composite role+status index
CREATE INDEX IF NOT EXISTS "User_role_status_idx" ON "User"("role", "status");
-- CreatedAt index
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
