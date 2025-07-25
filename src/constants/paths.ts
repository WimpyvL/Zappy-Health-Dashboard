/**
 * @fileoverview Application route paths constants.
 * Centralized location for all route definitions to ensure consistency
 * and make route changes easier to manage across the application.
 */

// Type definitions for better type safety
interface AdminPaths {
  auditLog: string;
  providers: string;
  pharmacies: string;
  discounts: string;
  tags: string;
  products: string;
  resources: string;
  uiComponents: string;
}

interface AppPaths {
  // Public Routes
  home: string;
  login: string;
  signup: string;
  forgotPassword: string;
  resetPassword: string;
  confirmEmail: string;
  publicForm: string;
  publicIntake: string;

  // Authenticated Routes
  dashboard: string;
  
  // Patient Facing
  patientHome: string;
  shop: string;

  // Admin/Provider Routes
  patients: string;
  patientDetail: string;
  sessions: string;
  sessionDetail: string;
  orders: string;
  invoices: string;
  tasks: string;
  messages: string;
  settings: string;
  calendar: string;
  insurance: string;

  // Admin Only
  admin: AdminPaths;
}

export const paths: AppPaths = {
  // --- Public Routes ---
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  confirmEmail: '/confirm-email',
  publicForm: '/public/forms/:formId',
  publicIntake: '/public/intake/:category?',

  // --- Authenticated Routes ---
  dashboard: '/dashboard',
  
  // --- Patient Facing ---
  patientHome: '/my-services', // New patient home
  shop: '/shop', // New shop page

  // --- Admin/Provider Routes ---
  patients: '/patients',
  patientDetail: '/patients/:id',
  sessions: '/sessions',
  sessionDetail: '/sessions/:id',
  orders: '/orders',
  invoices: '/invoices',
  tasks: '/tasks',
  messages: '/messages',
  settings: '/settings',
  calendar: '/calendar',
  insurance: '/insurance',

  // --- Admin Only ---
  admin: {
    auditLog: '/admin/audit-log',
    providers: '/admin/providers',
    pharmacies: '/admin/pharmacies',
    discounts: '/admin/discounts',
    tags: '/admin/tags',
    products: '/admin/products',
    resources: '/admin/resources',
    uiComponents: '/admin/ui-components',
  },
} as const;

// Helper functions for dynamic path generation
export const pathHelpers = {
  /**
   * Generate a patient detail path with the given patient ID
   */
  patientDetail: (id: string): string => `/patients/${id}`,
  
  /**
   * Generate a session detail path with the given session ID
   */
  sessionDetail: (id: string): string => `/sessions/${id}`,
  
  /**
   * Generate a public form path with the given form ID
   */
  publicForm: (formId: string): string => `/public/forms/${formId}`,
  
  /**
   * Generate a public intake path with optional category
   */
  publicIntake: (category?: string): string => 
    category ? `/public/intake/${category}` : '/public/intake',
} as const;

// Export types for use in other parts of the application
export type { AppPaths, AdminPaths };

// Route validation helpers
export const routeValidation = {
  /**
   * Check if a path is a public route (doesn't require authentication)
   */
  isPublicRoute: (pathname: string): boolean => {
    const publicRoutes = [
      paths.home,
      paths.login,
      paths.signup,
      paths.forgotPassword,
      paths.resetPassword,
      paths.confirmEmail,
    ];
    
    // Check exact matches
    if (publicRoutes.includes(pathname)) {
      return true;
    }
    
    // Check pattern matches for dynamic routes
    if (pathname.startsWith('/public/')) {
      return true;
    }
    
    return false;
  },
  
  /**
   * Check if a path is an admin-only route
   */
  isAdminRoute: (pathname: string): boolean => {
    return pathname.startsWith('/admin/') || pathname.startsWith('/dashboard/admin/');
  },
  
  /**
   * Check if a path is a patient-facing route
   */
  isPatientRoute: (pathname: string): boolean => {
    const patientRoutes = [paths.patientHome, paths.shop];
    return patientRoutes.includes(pathname) || pathname.startsWith('/my-');
  },
} as const;
