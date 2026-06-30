export const ROUTES = {
  HOME:         '/',
  CITIZEN:      '/citizen',
  REPORT:       '/report',
  REPORT_EDIT:  '/report/:id/edit',
  MAP:          '/map',
  TRACK:        '/track',
  TRACK_ISSUE:  '/track/:id',
  DASHBOARD:    '/dashboard',
  GAMIFICATION: '/leaderboard',
  MISSIONS:     '/missions',
  AVATAR:       '/citizen/avatar',
  ADMIN:        '/admin',
  PROFILE:      '/profile',
  PROFILE_USER: '/profile/:id',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
