-- Align avatar defaults with the imported Avatar.zip system.
ALTER TABLE "User" ALTER COLUMN "activeCharacter" SET DEFAULT 'male-0-explorer';

UPDATE "User"
SET "activeCharacter" = CASE "activeCharacter"
  WHEN 'observer' THEN 'male-0-explorer'
  WHEN 'reporter' THEN 'male-300-reporter'
  WHEN 'guardian' THEN 'male-600-guardian'
  WHEN 'detective' THEN 'male-1000-detective'
  WHEN 'hero' THEN 'male-2000-hero'
  WHEN 'legend' THEN 'male-2000-hero'
  ELSE "activeCharacter"
END;

DROP TABLE IF EXISTS "Pet";
