# Implementation Plan

## Problem
1. **"My Cases" shows 0 cases**: The frontend (`IssueInbox.tsx`) applies a strict filter (`assignedTo === user.name || assignedTo === user.email`). This hides issues from the City Admin (who oversees all cases) and from Department/Ward Officers if the assignment is to their department/ward but not explicitly their email string. 
2. **Team cards show 0 active/resolved cases**: The database contains seeded issues that were created without running the AI assignment engine, leaving `assignedTo` and `department` null. `issueBelongsToAuthority` in `authorityAssignmentService.ts` currently fails to map these unassigned issues to Department Officers because it doesn't fall back to `issue.category`.
3. **Duplicate Municipal Corporation**: There is a duplicate authority account representing the Municipal Corporation in the database, conflicting with the City Admin.

## Proposed Changes

### 1. Fix "My Cases" Frontend Logic
**File**: `src/pages/authority/IssueInbox.tsx`
- **Action**: Remove the client-side `data.filter` for `myCasesOnly`. The backend `getAuthorityIssuesHandler` already enforces the exact role-based access rules (City Admin sees all, Dept Officers see their dept, Ward Officers see their ward). 

### 2. Robust Team Card Counts (Backend)
**File**: `backend/src/routes/users.ts`
- **Action**: Update the `issues` query in `/authority-team` to include `category: true`.

**File**: `backend/src/services/authorityAssignmentService.ts`
- **Action**: Update `issueBelongsToAuthority` to accept `category` and fall back to `getDepartmentAssignmentForCategory(issue.category)` if `issue.department` is missing. This ensures legacy/unassigned issues are still correctly attributed to the responsible department officer.

### 3. Cleanup Duplicate Authority Account
- **Action**: Run a Prisma query to delete the duplicate "Kolkata Municipal Authority" (role: Authority, ward: City-Wide) account from the database. The "JanSeva City Admin" (role: Admin) will remain as the sole representative of the Municipal Corporation.

## Verification
- Load the application and verify "My Cases" displays issues for the City Admin.
- Verify the Team page shows accurate Active and Resolved case counts.
- Ensure the duplicate Municipal Corporation account is no longer visible.
