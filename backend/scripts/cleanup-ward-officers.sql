-- Cleanup script: delete legacy per-ward officer accounts
-- Keeps only officer@janseva.gov (the shared Ward Officer account)
-- Run against the Neon PostgreSQL database.
--
-- Preview first (SELECT):
SELECT id, name, email, role, ward
FROM "User"
WHERE role = 'Authority'
  AND email != 'officer@janseva.gov'
  AND (
    email LIKE '%ward%@janseva.gov'
    OR name LIKE 'Ward % Officer'
    OR name = 'Parks & Recreation Officer'
    OR (ward IS NOT NULL AND ward NOT IN ('All', 'City-Wide') AND email != 'officer@janseva.gov')
  );

-- DELETE (uncomment after verifying the SELECT above returns only rows you want gone):
-- DELETE FROM "User"
-- WHERE role = 'Authority'
--   AND email != 'officer@janseva.gov'
--   AND (
--     email LIKE '%ward%@janseva.gov'
--     OR name LIKE 'Ward % Officer'
--     OR name = 'Parks & Recreation Officer'
--     OR (ward IS NOT NULL AND ward NOT IN ('All', 'City-Wide') AND email != 'officer@janseva.gov')
--   );

-- After deletion, ensure officer@janseva.gov has no DB ward (NULL)
-- so the session-picker flow takes over:
-- UPDATE "User" SET ward = NULL WHERE email = 'officer@janseva.gov';
