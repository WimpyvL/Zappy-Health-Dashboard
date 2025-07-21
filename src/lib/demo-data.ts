// src/lib/demo-data.ts
// Demo data service for development mode when Firebase is not configured

export const isDemoMode = () => {
  return !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
         process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key-for-development';
};

// Mock patient data
export const demoPatients = [
  {
    id: 'demo-patient-1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@email.com',
    dateOfBirth: '1990-05-15',
    status: 'active',
    plan: 'premium',
    lastActive: new Date('2024-01-15'),
    tags: ['diabetes', 'regular-checkup'],
    orders: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'demo-patient-2',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@email.com',
    dateOfBirth: '1985-08-22',
    status: 'active',
    plan: 'basic',
    lastActive: new Date('2024-01-14'),
    tags: ['hypertension'],
    orders: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'demo-patient-3',
    firstName: 'Carol',
    lastName: 'Williams',
    email: 'carol.williams@email.com',
    dateOfBirth: '1992-12-03',
    status: 'inactive',
    plan: 'premium',
    lastActive: new Date('2024-01-10'),
    tags: ['wellness'],
    orders: [],
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-10'),
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
  activePatients: demoPatients.filter(p => p.status === 'active').length,
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