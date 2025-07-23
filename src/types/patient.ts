import { BaseDocument } from './global';

export interface Patient extends BaseDocument {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'inactive' | 'pending';
  providerId?: string; // The ID of the primary provider assigned to this patient
}
