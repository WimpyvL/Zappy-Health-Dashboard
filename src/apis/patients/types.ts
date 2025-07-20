export interface Patient {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
  providerId?: string;
}
