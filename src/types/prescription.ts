import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from './global';

export interface Prescription extends BaseDocument {
  patientId: string;
  providerId: string;
  orderId?: string;
  medication: string;
  dosage: string;
  instructions: string;
  quantity: number;
  refills: number;
  daysSupply: number;
  pharmacyId?: string;
  status: 'active' | 'inactive' | 'cancelled';
  expiresAt: Timestamp;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  drugClass: string;
  controlledSchedule?: string;
  ndcNumber?: string;
}

export interface ComplianceFlag {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  details: string | any[];
}
