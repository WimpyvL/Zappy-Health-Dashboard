import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from './global';

export interface Consultation extends BaseDocument {
  patientId: string;
  providerId: string;
  type: ConsultationType;
  status: ConsultationStatus;
  scheduledAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // in minutes
  notes?: string;
  diagnosis?: string;
  prescriptions?: string[];
  followUpRequired?: boolean;
  followUpDate?: Timestamp;
  videoCallUrl?: string;
  recordingUrl?: string;
}

export enum ConsultationType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  URGENT = 'urgent',
  ROUTINE = 'routine',
  SPECIALIST = 'specialist'
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}



export interface ConsultationFilters {
  patientId?: string;
  providerId?: string;
  status?: ConsultationStatus[];
  type?: ConsultationType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
