import type { Category, Issue, Prisma, Role, Status, User } from '@prisma/client';

export type AuthorityUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'ward'>;

type DepartmentAssignment = {
  name: string;
  categories: Category[];
  assigneeEmail: string;
  aliases: string[];
};

export const DEPARTMENT_ASSIGNMENTS: DepartmentAssignment[] = [
  {
    name: 'Road Maintenance Department',
    categories: ['Pothole', 'RoadDamage'],
    assigneeEmail: 'roads@janseva.gov',
    aliases: ['Road Maintenance Department', 'Roads & Infrastructure'],
  },
  {
    name: 'Water Supply Department',
    categories: ['WaterLeak', 'Sewage'],
    assigneeEmail: 'water@janseva.gov',
    aliases: ['Water Supply Department', 'Drainage & Sewerage Department', 'Water & Sewage'],
  },
  {
    name: 'Electrical Department',
    categories: ['Streetlight'],
    assigneeEmail: 'electricity@janseva.gov',
    aliases: ['Electrical Department', 'Electricity Department'],
  },
  {
    name: 'Sanitation Department',
    categories: ['WasteDump'],
    assigneeEmail: 'waste@janseva.gov',
    aliases: ['Sanitation Department', 'Sanitation & Waste', 'Waste Management Department'],
  },
  // ParkIssue and Other categories will fall back to City Admin for manual assignment
];

// ── Statuses that are "closed" for SLA purposes ──────────────────────────────

const CLOSED_STATUSES: Status[] = ['Resolved', 'Closed'];

export function isClosedStatus(status: Status) {
  return CLOSED_STATUSES.includes(status);
}

// ── Role classification helpers ───────────────────────────────────────────────

/**
 * City Admin: role === 'Admin' OR ward === 'City-Wide'.
 * Has full assignment/reassignment authority and citywide visibility.
 */
export function isCityAdmin(user: Pick<User, 'role' | 'ward'>) {
  return user.role === 'Admin' || user.ward === 'City-Wide';
}

/**
 * Department Officer: role === 'Authority' AND email matches a department's
 * assigneeEmail. Responsible for executing work on assigned issues.
 */
export function isDepartmentOfficer(user: Pick<User, 'role' | 'email'>) {
  if (user.role !== 'Authority') return false;
  return DEPARTMENT_ASSIGNMENTS.some((d) => d.assigneeEmail === user.email);
}

/**
 * Ward Officer: role === 'Authority', has a specific ward, and is NOT a
 * department officer. Responsible only for verifying completed work.
 */
export function isWardOfficer(user: Pick<User, 'role' | 'email' | 'ward'>) {
  if (user.role !== 'Authority') return false;
  if (isDepartmentOfficer(user)) return false;
  return Boolean(user.ward && user.ward !== 'All' && user.ward !== 'City-Wide');
}

export function isDuplicateMunicipalAuthority(user: AuthorityUser, hasAdmin: boolean) {
  return hasAdmin && user.role === 'Authority' && user.ward === 'City-Wide';
}

// ── Department lookup helpers ─────────────────────────────────────────────────

export function getDepartmentAssignmentForCategory(category: Category) {
  return DEPARTMENT_ASSIGNMENTS.find((dept) => dept.categories.includes(category));
}

export function getDepartmentAssignmentForName(department?: string | null) {
  if (!department) return undefined;
  const normalized = department.trim().toLowerCase();
  return DEPARTMENT_ASSIGNMENTS.find((dept) =>
    dept.aliases.some((alias) => alias.toLowerCase() === normalized) ||
    dept.name.toLowerCase() === normalized,
  );
}

export function getDepartmentAssignmentForUser(user: Pick<User, 'email'>) {
  return DEPARTMENT_ASSIGNMENTS.find((dept) => dept.assigneeEmail === user.email);
}

export function getCanonicalDepartment(category: Category, department?: string | null) {
  return (
    getDepartmentAssignmentForName(department)?.name ??
    getDepartmentAssignmentForCategory(category)?.name ??
    department ??
    'Municipal Operations Cell'
  );
}

// ── Assignment resolution ─────────────────────────────────────────────────────

function findUserByEmail(users: AuthorityUser[], email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function findWardOfficer(users: AuthorityUser[], zone?: string | null) {
  if (!zone) return undefined;
  return users.find(
    (user) =>
      user.role === 'Authority' &&
      user.ward === zone &&
      !isDepartmentOfficer(user),
  );
}

function findCityAdmin(users: AuthorityUser[]) {
  return (
    users.find((user) => user.role === 'Admin') ??
    users.find((user) => user.ward === 'City-Wide') ??
    users[0]
  );
}

export function resolveAuthorityAssignment(
  issue: Pick<Issue, 'category' | 'department' | 'zone'>,
  users: AuthorityUser[],
) {
  const department = getCanonicalDepartment(issue.category, issue.department);
  const departmentAssignment =
    getDepartmentAssignmentForName(department) ??
    getDepartmentAssignmentForCategory(issue.category);
  const departmentOfficer = departmentAssignment
    ? findUserByEmail(users, departmentAssignment.assigneeEmail)
    : undefined;

  if (departmentOfficer) {
    return {
      department,
      assignedTo: departmentOfficer.email,
      assigneeName: departmentOfficer.name,
      assignmentType: 'department' as const,
    };
  }

  const wardOfficer = findWardOfficer(users, issue.zone);
  if (wardOfficer) {
    return {
      department,
      assignedTo: wardOfficer.email,
      assigneeName: wardOfficer.name,
      assignmentType: 'ward' as const,
    };
  }

  const cityAdmin = findCityAdmin(users);
  return {
    department,
    assignedTo: cityAdmin?.email ?? null,
    assigneeName: cityAdmin?.name ?? null,
    assignmentType: 'city-admin' as const,
  };
}

// ── Visibility / access checks ────────────────────────────────────────────────

export function issueBelongsToAuthority(
  issue: Pick<Issue, 'assignedTo' | 'department' | 'zone' | 'category'>,
  user: Pick<User, 'email' | 'role' | 'ward'>,
) {
  if (isCityAdmin(user)) return true;
  if (issue.assignedTo === user.email) return true;

  const departmentAssignment = getDepartmentAssignmentForUser(user);
  if (departmentAssignment) {
    const issueDepartment =
      getDepartmentAssignmentForName(issue.department) ??
      getDepartmentAssignmentForCategory(issue.category);
    return issueDepartment?.assigneeEmail === user.email;
  }

  // Ward officers see issues in their ward (unrestricted by status here —
  // status scoping is applied in getAuthorityWhereClause)
  return Boolean(user.ward && user.ward !== 'All' && issue.zone === user.ward);
}

/**
 * Builds the Prisma WHERE clause that scopes issues to what the requesting
 * authority user is allowed to see:
 *
 *  City Admin      → all issues (no filter)
 *  Dept Officer    → issues assigned to their dept email OR matching category
 *  Ward Officer    → only NeedsVerification issues in their ward
 */
export function getAuthorityWhereClause(
  user: Pick<User, 'email' | 'role' | 'ward'>,
): Prisma.IssueWhereInput {
  if (isCityAdmin(user)) return {};

  // Ward Officer: restricted to NeedsVerification in their ward only
  if (isWardOfficer(user)) {
    return {
      zone: user.ward!,
      status: 'NeedsVerification',
    };
  }

  // Department Officer: see issues assigned to their dept
  const accessWhere: Prisma.IssueWhereInput[] = [{ assignedTo: user.email }];

  const departmentAssignment = getDepartmentAssignmentForUser(user);
  if (departmentAssignment) {
    accessWhere.push({
      department: { in: [departmentAssignment.name, ...departmentAssignment.aliases] },
    });
    accessWhere.push({
      category: { in: departmentAssignment.categories },
    });
  }

  return { OR: accessWhere };
}
