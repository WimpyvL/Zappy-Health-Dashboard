export interface Contraindication {
  type: string;
  severity: 'absolute' | 'relative' | 'warning' | 'caution';
  title: string;
  description: string;
  details: string;
  recommendation: string;
  source: string;
  medication?: string;
  condition?: string;
  interactingMedication?: string;
  patientAge?: number;
  pregnancyCategory?: string;
}
