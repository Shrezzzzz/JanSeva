export type Role = 'Citizen' | 'Moderator' | 'Authority' | 'Admin';

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
  ward?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  ward?: string | null;
  xp: number;
  level: number;
  badges: string[];
  reportStreak: number;
  createdAt: Date;
}
