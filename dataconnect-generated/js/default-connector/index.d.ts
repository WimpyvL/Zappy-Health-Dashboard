import { ConnectorConfig, DataConnect, QueryRef, QueryPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Appointment_Key {
  id: UUIDString;
  __typename?: 'Appointment_Key';
}

export interface AvailabilitySlot_Key {
  id: UUIDString;
  __typename?: 'AvailabilitySlot_Key';
}

export interface ListUsersData {
  users: ({
    authId: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: TimestampString;
    phoneNumber?: string | null;
    address?: string | null;
    dateOfBirth?: DateString | null;
    profilePictureUrl?: string | null;
    licenseNumber?: string | null;
    specialties?: string[] | null;
  })[];
}

export interface MedicalRecord_Key {
  id: UUIDString;
  __typename?: 'MedicalRecord_Key';
}

export interface Service_Key {
  id: UUIDString;
  __typename?: 'Service_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect): QueryPromise<ListUsersData, undefined>;

