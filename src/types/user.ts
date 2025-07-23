import { User as FirebaseUser } from 'firebase/auth';
import { BaseDocument } from './global';

export type UserRole = 'admin' | 'provider' | 'patient';

// Base user information, common to all roles
export interface User extends BaseDocument, Partial<FirebaseUser> {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string; // This will be the primary email from Firebase Auth
  phoneNumber?: string;
  
  // Optional fields that might not be available on all user objects
  // depending on the context of the query.
  providerData?: any[];
  stsTokenManager?: {
    refreshToken: string;
    accessToken: string;
    expirationTime: number;
  };
}

// Specific properties for a user with the 'provider' role
export interface ProviderProfile {
  specialties: string[];
  licenseNumber: string;
  isActive: boolean;
  availability: ProviderAvailability[];
}

export interface ProviderAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
}

// A comprehensive User type that can hold role-specific profiles
export type AppUser = User & {
  providerProfile?: ProviderProfile;
  // patientProfile?: PatientProfile; // Example for future extension
};
