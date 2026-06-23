export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain an uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain a number' };
  return { valid: true };
}

export function isValidCoords(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function validateIssueForm(data: {
  description?: string;
  lat?: number;
  lng?: number;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.description || data.description.trim().length < 10)
    errors.description = 'Please describe the issue (at least 10 characters)';
  if (data.lat == null || data.lng == null)
    errors.location = 'Please select a location on the map';
  else if (!isValidCoords(data.lat, data.lng))
    errors.location = 'Invalid coordinates';
  return errors;
}

export function isFileSizeOk(file: File, maxMB = 50): boolean {
  return file.size <= maxMB * 1024 * 1024;
}

export function isAllowedFileType(file: File): boolean {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
  return allowed.includes(file.type);
}
