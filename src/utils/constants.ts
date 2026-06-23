export const APP_NAME = 'JanSeva';
export const APP_TAGLINE = 'Report. Verify. Resolve. Together.';

export const DEFAULT_MAP_CENTER: [number, number] = [22.5726, 88.3639]; // Kolkata
export const DEFAULT_MAP_ZOOM = 13;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 18;

export const UPVOTES_FOR_VERIFICATION = 10;
export const DUPLICATE_CONFIDENCE_THRESHOLD = 0.8;
export const DUPLICATE_RADIUS_METERS = 200;

export const MAX_UPLOAD_FILES = 5;
export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

export const XP_REWARDS = {
  REPORT_SUBMITTED: 20,
  REPORT_VERIFIED_BY_COMMUNITY: 10,
  REPORT_RESOLVED: 50,
  COMMENT_POSTED: 5,
  ISSUE_VERIFIED: 5,
  STREAK_BONUS: 15,
} as const;

export const SEVERITY_LABELS = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
} as const;

export const STATUS_LABELS = {
  Reported: 'Reported',
  Verified: 'Verified',
  Assigned: 'Assigned',
  InProgress: 'In Progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
} as const;

export const CATEGORY_LABELS = {
  Pothole: 'Pothole',
  Streetlight: 'Streetlight',
  WaterLeak: 'Water Leak',
  WasteDump: 'Waste Dump',
  Sewage: 'Sewage',
  RoadDamage: 'Road Damage',
  ParkIssue: 'Park Issue',
  Other: 'Other',
} as const;

export const DATE_RANGE_LABELS = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'all': 'All Time',
} as const;

export const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
