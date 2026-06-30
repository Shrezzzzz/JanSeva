/**
 * Department configuration for JanSeva.
 *
 * Maps each issue category to the responsible department and the default
 * team member (by email) who should handle it. The ward officer is always
 * notified first before the department assignment is finalised.
 */

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Which issue categories this department handles */
  categories: string[];
  /** Email of the default assignee for this department */
  defaultAssignee: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'roads',
    name: 'Road Maintenance Department',
    description: 'Potholes and road damage repairs',
    icon: '🚧',
    categories: ['Pothole', 'RoadDamage'],
    defaultAssignee: 'roads@janseva.gov',
  },
  {
    id: 'water',
    name: 'Water Supply Department',
    description: 'Water leaks, pipe bursts, and sewage overflow',
    icon: '🚰',
    categories: ['WaterLeak', 'Sewage'],
    defaultAssignee: 'water@janseva.gov',
  },
  {
    id: 'electricity',
    name: 'Electrical Department',
    description: 'Streetlight and public electrical repairs',
    icon: '💡',
    categories: ['Streetlight'],
    defaultAssignee: 'electricity@janseva.gov',
  },
  {
    id: 'sanitation',
    name: 'Sanitation Department',
    description: 'Illegal dumping and waste management',
    icon: '🗑️',
    categories: ['WasteDump'],
    defaultAssignee: 'waste@janseva.gov',
  },
];

/** Get the department for a given issue category */
export function getDepartmentForCategory(category: string): Department {
  // For categories without a specific department, default to Roads (can be reassigned by City Admin)
  return (
    DEPARTMENTS.find((d) => d.categories.includes(category)) ??
    DEPARTMENTS[0] // fallback: Road Maintenance Department
  );
}
