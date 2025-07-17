
export const paths = {
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
};
