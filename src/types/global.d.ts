import { Timestamp } from 'firebase/firestore';

// Global type definitions for the telehealth dashboard

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;
      FIREBASE_ADMIN_PRIVATE_KEY: string;
      FIREBASE_ADMIN_CLIENT_EMAIL: string;
      NEXT_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
      NEXT_PUBLIC_API_URL: string;
      ANALYZE?: string;
    }
  }

  // Custom matchers for Jest
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toHaveValue(value: string | number): R;
    }
  }

  // Window extensions for monitoring
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
    dataLayer?: any[];
    __MONITORING_INITIALIZED__?: boolean;
  }
}

// Base document interface for all Firestore documents
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User roles enum
export type UserRole = 'admin' | 'provider' | 'patient';

// Permission types
export type Permission = 
  | 'read_patients' 
  | 'write_patients' 
  | 'delete_patients'
  | 'read_providers' 
  | 'write_providers' 
  | 'delete_providers'
  | 'read_sessions' 
  | 'write_sessions' 
  | 'delete_sessions'
  | 'read_orders' 
  | 'write_orders' 
  | 'delete_orders'
  | 'manage_users'
  | 'view_analytics'
  | 'system_admin';

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Database operation result
export interface DatabaseResponse<T = any> extends ApiResponse<T> {
  timestamp?: Timestamp;
}

// Pagination interface
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

// Search and filter interfaces
export interface SearchFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'array-contains';
  value: any;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// Monitoring interfaces
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// UI State interfaces
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Timestamp;
  read: boolean;
  persistent?: boolean;
}

export interface ModalState {
  id: string;
  type: string;
  props?: Record<string, any>;
  persistent?: boolean;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface FilterState {
  [key: string]: any;
}

// Form interfaces
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  disabled?: boolean;
  helpText?: string;
}

export interface FormConfig {
  fields: FormField[];
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  layout?: 'single' | 'double' | 'triple';
}

// Component configuration interfaces
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ComponentType;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

// Admin page configuration
export interface AdminPageConfig<T extends BaseDocument = BaseDocument> {
  title: string;
  description?: string;
  collectionName: string;
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  permissions?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
    import?: boolean;
  };
  filters?: Array<{
    key: string;
    type: 'text' | 'select' | 'date' | 'number';
    label: string;
    options?: Array<{ label: string; value: any }>;
  }>;
  defaultSort?: SortOption;
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
}

// Export the global types
export {};