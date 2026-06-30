-- Autonomous Civic Intelligence Layer
-- Adds nullable AI enrichment fields only; existing report flow remains backward compatible.

ALTER TABLE "Issue" ADD COLUMN "duplicateConfidence" DOUBLE PRECISION;
ALTER TABLE "Issue" ADD COLUMN "resolutionConfidence" DOUBLE PRECISION;
ALTER TABLE "Issue" ADD COLUMN "resolutionReason" TEXT;
ALTER TABLE "Issue" ADD COLUMN "departmentConfidence" DOUBLE PRECISION;
ALTER TABLE "Issue" ADD COLUMN "departmentReason" TEXT;
ALTER TABLE "Issue" ADD COLUMN "priorityScore" INTEGER;
ALTER TABLE "Issue" ADD COLUMN "priorityLabel" TEXT;
ALTER TABLE "Issue" ADD COLUMN "priorityReason" TEXT;
ALTER TABLE "Issue" ADD COLUMN "citizenGuidance" JSONB;
ALTER TABLE "Issue" ADD COLUMN "authoritySummary" TEXT;
ALTER TABLE "Issue" ADD COLUMN "aiNotifications" JSONB;
ALTER TABLE "Issue" ADD COLUMN "workflowRecommendation" JSONB;
ALTER TABLE "Issue" ADD COLUMN "communityInsight" JSONB;
ALTER TABLE "Issue" ADD COLUMN "heatmapInsight" JSONB;
ALTER TABLE "Issue" ADD COLUMN "aiModelUsed" TEXT;
ALTER TABLE "Issue" ADD COLUMN "aiAnalyzedAt" TIMESTAMP(3);
ALTER TABLE "Issue" ADD COLUMN "aiFailureReason" TEXT;

CREATE INDEX "Issue_priorityScore_idx" ON "Issue"("priorityScore" DESC);
