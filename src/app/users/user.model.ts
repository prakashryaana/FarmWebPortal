export type UserRole = 'FARMOWNER' | 'FARMHELP' | 'EASYGROWADMIN' | 'AGRONOMIST' | 'TRANSCRIBER' | 'UNKNOWN';
export type SystemStatus = 'ACTIVE' | 'DEACTIVATED' | 'UNKNOWN';

export interface User {
  userId?: string;
  name: string;
  mobile: string;
  email?: string;
  roles: UserRole[];  // Array of UserRole union type
  status?: string;
  systemStatus?: string;
}

export interface CreateUserRequest {
  mobile: string;
  email?: string;
  password: string;
  roles: UserRole[];
}

export interface UpdateUserRequest {
  mobile?: string;
  email?: string;
  roles: UserRole[];
}
