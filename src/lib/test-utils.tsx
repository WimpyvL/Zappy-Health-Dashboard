import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';

// Mock user types for testing
export const mockUsers = {
  admin: {
    uid: 'test-admin-123',
    email: 'admin@test.com',
    role: 'admin' as const,
    displayName: 'Test Admin',
    firstName: 'Test',
    lastName: 'Admin',
  },
  provider: {
    uid: 'test-provider-123',
    email: 'provider@test.com',
    role: 'provider' as const,
    displayName: 'Test Provider',
    firstName: 'Test',
    lastName: 'Provider',
    specialty: 'General Medicine',
  },
  patient: {
    uid: 'test-patient-123',
    email: 'patient@test.com',
    role: 'patient' as const,
    displayName: 'Test Patient',
    firstName: 'Test',
    lastName: 'Patient',
  },
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
};

// Mock Firestore
export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
};

// Test query client with disabled retries and logging
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Auth context wrapper for testing
interface AuthWrapperProps {
  children: React.ReactNode;
  user?: typeof mockUsers.admin | typeof mockUsers.provider | typeof mockUsers.patient | null;
  loading?: boolean;
}

export function AuthWrapper({ children, user = null, loading = false }: AuthWrapperProps) {
  const mockAuthValue = {
    user,
    loading,
    signIn: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updateUserProfile: jest.fn(),
    hasRole: jest.fn((role: string) => user?.role === role),
    hasPermission: jest.fn(() => true),
    // UI State Management (mock)
    uiState: {
      sidebarCollapsed: false,
      theme: 'system' as const,
      notifications: [],
      modals: [],
      loadingStates: {},
      globalSearchQuery: '',
      activeFilters: {},
    },
    toggleSidebar: jest.fn(),
    setTheme: jest.fn(),
    addNotification: jest.fn(),
    markNotificationRead: jest.fn(),
    clearNotifications: jest.fn(),
    unreadNotificationCount: 0,
    openModal: jest.fn(),
    closeModal: jest.fn(),
    closeAllModals: jest.fn(),
    setLoading: jest.fn(),
    isLoading: jest.fn(),
    setGlobalSearch: jest.fn(),
    setFilter: jest.fn(),
    clearFilters: jest.fn(),
  };

  return (
    <div data-testid="auth-wrapper">
      {children}
    </div>
  );
}

// Complete test wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  user?: typeof mockUsers.admin | typeof mockUsers.provider | typeof mockUsers.patient | null;
  authLoading?: boolean;
}

export function AllProviders({ 
  children, 
  queryClient = createTestQueryClient(),
  user = null,
  authLoading = false 
}: AllProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthWrapper user={user} loading={authLoading}>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Custom render function with all providers
const customRender = (
  ui: React.ReactElement,
  options: RenderOptions & {
    queryClient?: QueryClient;
    user?: typeof mockUsers.admin | typeof mockUsers.provider | typeof mockUsers.patient | null;
    authLoading?: boolean;
  } = {}
) => {
  const { queryClient, user, authLoading, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient} user={user} authLoading={authLoading}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Database test utilities
export const dbTestUtils = {
  // Mock successful database responses
  mockSuccess: function<T>(data: T) {
    return {
      data,
      error: null,
      success: true,
    };
  },

  // Mock error database responses
  mockError: function(errorMsg: string) {
    return {
      data: null,
      error: errorMsg,
      success: false,
    };
  },

  // Mock paginated responses
  mockPaginatedSuccess: function<T>(data: T[], hasMore = false) {
    return {
      data,
      hasMore,
      lastDocument: null,
      total: data.length,
      error: null,
      success: true,
    };
  },

  // Create mock Firestore document
  mockDoc: function(id: string, data: any) {
    return {
      id,
      data: () => data,
      exists: () => true,
    };
  },

  // Create mock Firestore collection
  mockCollection: function(docs: any[]) {
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
    };
  },
};

// Performance testing utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: async function(renderFn: () => Promise<any>) {
    const start = performance.now();
    const result = await renderFn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  },

  // Mock performance observer
  mockPerformanceObserver: function() {
    const mockEntries: any[] = [];
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => mockEntries),
      getEntries: () => mockEntries,
      addEntry: (entry: any) => mockEntries.push(entry),
    };
  },
};

// Accessibility testing utilities
export const a11yUtils = {
  // Check for common accessibility issues
  checkBasicA11y: async function(container: HTMLElement) {
    const issues: string[] = [];

    // Check for missing alt text on images
    const images = container.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        issues.push(`Image ${index} missing alt text`);
      }
    });

    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const hasAccessibleName = 
        button.textContent?.trim() ||
        button.getAttribute('aria-label') ||
        button.getAttribute('aria-labelledby') ||
        button.querySelector('[aria-label]');
      
      if (!hasAccessibleName) {
        issues.push(`Button ${index} missing accessible name`);
      }
    });

    // Check for form inputs without labels
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = 
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        container.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form input ${index} missing label`);
      }
    });

    return issues;
  },
};

// Error testing utilities
export const errorUtils = {
  // Simulate component errors
  ThrowError: function({ shouldThrow = true, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) {
    if (shouldThrow) {
      throw new Error(message);
    }
    return <div>No error</div>;
  },

  // Mock console methods for error testing
  mockConsole: function() {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = jest.fn();
    console.warn = jest.fn();

    return {
      restore: () => {
        console.error = originalError;
        console.warn = originalWarn;
      },
      getErrors: () => (console.error as jest.Mock).mock.calls,
      getWarnings: () => (console.warn as jest.Mock).mock.calls,
    };
  },
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the default render with our custom render
export { customRender as render };