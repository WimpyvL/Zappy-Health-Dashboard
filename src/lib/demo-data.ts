// src/lib/demo-data.ts
// Demo data service for development mode when Firebase is not configured
import { Timestamp } from 'firebase/firestore';

export const isDemoMode = () => {
  return !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
         process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key-for-development';
};

// Mock patient data
export const demoPatients = [
  {
    id: 'demo-patient-1',
    firstName: 'John',
    lastName: 'Smith',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    dateOfBirth: '1985-06-15',
    dob: new Date('1985-06-15'),
    address: '123 Health St, Wellness City, CA 90210',
    status: 'Active',
    plan: 'Premium',
    lastActive: Timestamp.fromDate(new Date('2024-07-20T10:00:00Z')),
    tags: ['diabetes', 'hypertension', 'regular-checkup'],
    orders: 2,
    createdAt: Timestamp.fromDate(new Date('2024-01-01T09:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-07-20T10:00:00Z')),
    pharmacy: 'CVS Pharmacy, Wellness City',
    insuranceProvider: 'UnitedHealth Group',
    policyNumber: 'UHG123456789',
    groupNumber: 'GROUP1A',
    insuranceHolder: 'Self',
    allergies: ['Penicillin', 'Peanuts'],
    medications: ['Lisinopril 10mg', 'Metformin 500mg']
  },
  {
    id: 'demo-patient-2',
    firstName: 'Alice',
    lastName: 'Johnson',
    name: 'Alice Johnson',
    email: 'alice.johnson@email.com',
    dateOfBirth: '1990-05-15',
    dob: new Date('1990-05-15'),
    address: '456 Wellness Ave, Healthville, TX 75001',
    status: 'Active',
    plan: 'Premium',
    lastActive: Timestamp.fromDate(new Date('2024-07-22T14:30:00Z')),
    tags: ['weight-management', 'new-patient'],
    orders: 1,
    createdAt: Timestamp.fromDate(new Date('2024-06-15T11:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-07-22T14:30:00Z')),
    pharmacy: 'Walgreens, Healthville',
    insuranceProvider: 'BlueCross BlueShield',
    policyNumber: 'BCBS987654321',
    groupNumber: 'GROUP2B',
    insuranceHolder: 'Self',
    allergies: ['None'],
    medications: []
  },
  {
    id: 'demo-patient-3',
    firstName: 'Bob',
    lastName: 'Smith',
    name: 'Bob Smith',
    email: 'bob.smith@email.com',
    dateOfBirth: '1985-08-22',
    dob: new Date('1985-08-22'),
    address: '789 Care Blvd, Meditown, FL 33101',
    status: 'Active',
    plan: 'Basic',
    lastActive: Timestamp.fromDate(new Date('2024-07-21T08:45:00Z')),
    tags: ['hypertension'],
    orders: 5,
    createdAt: Timestamp.fromDate(new Date('2023-11-10T18:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-07-21T08:45:00Z')),
    pharmacy: 'Rite Aid, Meditown',
    insuranceProvider: 'Aetna',
    policyNumber: 'AETNA1122334455',
    groupNumber: 'GROUP3C',
    insuranceHolder: 'Self',
    allergies: ['Aspirin'],
    medications: ['Amlodipine 5mg']
  },
  {
    id: 'demo-patient-4',
    firstName: 'Carol',
    lastName: 'Williams',
    name: 'Carol Williams',
    email: 'carol.williams@email.com',
    dateOfBirth: '1992-12-03',
    dob: new Date('1992-12-03'),
    address: '101 Vitality Ln, Vitality City, NY 10001',
    status: 'Inactive',
    plan: 'Premium',
    lastActive: Timestamp.fromDate(new Date('2024-05-10T12:00:00Z')),
    tags: ['wellness'],
    orders: 3,
    createdAt: Timestamp.fromDate(new Date('2024-02-20T16:30:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-05-10T12:00:00Z')),
    pharmacy: 'CVS Pharmacy, Vitality City',
    insuranceProvider: 'Cigna',
    policyNumber: 'CIGNA6677889900',
    groupNumber: 'GROUP4D',
    insuranceHolder: 'Self',
    allergies: ['Sulfa drugs'],
    medications: ['Multivitamin']
  },
];

// Mock sessions data
export const demoSessions = [
  {
    id: 'demo-session-1',
    patientId: 'demo-patient-1',
    providerId: 'demo-provider-1',
    status: 'scheduled',
    scheduledAt: new Date('2024-01-20T10:00:00Z'),
    type: 'consultation',
    notes: 'Regular check-up appointment',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'demo-session-2',
    patientId: 'demo-patient-2',
    providerId: 'demo-provider-1',
    status: 'completed',
    scheduledAt: new Date('2024-01-18T14:30:00Z'),
    type: 'follow-up',
    notes: 'Blood pressure monitoring',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-18'),
  },
];

// Mock orders data
export const demoOrders = [
  {
    id: 'demo-order-1',
    patientId: 'demo-patient-1',
    status: 'pending',
    total: 150.00,
    items: [
      { name: 'Blood Test Panel', price: 100.00, quantity: 1 },
      { name: 'Consultation Fee', price: 50.00, quantity: 1 },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'demo-order-2',
    patientId: 'demo-patient-2',
    status: 'completed',
    total: 75.00,
    items: [
      { name: 'Blood Pressure Monitoring', price: 75.00, quantity: 1 },
    ],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-18'),
  },
];

// Mock dashboard stats
export const demoDashboardStats = {
  totalPatients: demoPatients.length,
  activePatients: demoPatients.filter(p => p.status === 'Active').length,
  upcomingSessions: demoSessions.filter(s => s.status === 'scheduled').length,
  pendingOrders: demoOrders.filter(o => o.status === 'pending').length,
  newConsultations: demoSessions.filter(s => s.type === 'consultation').length,
  totalRevenue: demoOrders.reduce((sum, order) => sum + order.total, 0),
  weeklyGrowth: 12.5,
  monthlyGrowth: 8.3,
};

// Demo data service functions
export const demoDataService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return demoDashboardStats;
  },

  // Get patients with pagination
  getPatients: async (options: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const { limit = 10, offset = 0 } = options;
    const patients = demoPatients.slice(offset, offset + limit);
    return {
      data: patients,
      total: demoPatients.length,
      hasMore: offset + limit < demoPatients.length,
      error: null,
      success: true,
    };
  },

  // Get sessions
  getSessions: async (options: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: demoSessions,
      total: demoSessions.length,
      hasMore: false,
      error: null,
      success: true,
    };
  },

  // Get orders
  getOrders: async (options: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: demoOrders,
      total: demoOrders.length,
      hasMore: false,
      error: null,
      success: true,
    };
  },

  // Generic collection fetch (for compatibility)
  fetchCollection: async (collectionName: string, options: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switch (collectionName) {
      case 'patients':
        return demoDataService.getPatients(options);
      case 'sessions':
        return demoDataService.getSessions(options);
      case 'orders':
        return demoDataService.getOrders(options);
      default:
        return {
          data: [],
          total: 0,
          hasMore: false,
          error: null,
          success: true,
        };
    }
  },

  // Get single document
  getDocument: async (collectionName: string, id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    switch (collectionName) {
      case 'patients':
        return demoPatients.find(p => p.id === id) || null;
      case 'sessions':
        return demoSessions.find(s => s.id === id) || null;
      case 'orders':
        return demoOrders.find(o => o.id === id) || null;
      default:
        return null;
    }
  },

  // Mock mutations (for demo purposes)
  createDocument: async (collectionName: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const id = `demo-${collectionName}-${Date.now()}`;
    return { id, ...data, createdAt: new Date(), updatedAt: new Date() };
  },

  updateDocument: async (collectionName: string, id: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { id, ...data, updatedAt: new Date() };
  },

  deleteDocument: async (collectionName: string, id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  },
};

// Helper to determine if we should use demo data
export const shouldUseDemoData = () => {
  if (typeof window === 'undefined') return false; // Server side
  return isDemoMode();
};

export default demoDataService;
