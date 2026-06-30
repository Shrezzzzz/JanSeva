-- AlterEnum: add new Status values to the existing enum
-- PostgreSQL requires creating a new type and swapping it in

ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'Accepted';
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'Completed';
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'NeedsVerification';
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'Rejected';

-- AlterTable: add completionNotes and completionPhotos to Issue
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "completionNotes" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "completionPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
