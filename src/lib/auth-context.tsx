"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// User roles
export type UserRole = 'admin' | 'provider' | 'patient';

// Global notification types
export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Modal types
export interface Modal {
  id: string;
  type: string;
  props: Record<string, any>;
  isOpen: boolean;
}

// Global UI state
export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: GlobalNotification[];
  modals: Modal[];
  loadingStates: Record<string, boolean>;
  globalSearchQuery: string;
  activeFilters: Record<string, any>;
}

// Extended user interface
export interface AuthUser extends Partial<User> {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  license?: string;
}

// Auth context interface
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (userData: Partial<AuthUser>) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  
  // UI State Management
  uiState: UIState;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Notifications Management
  addNotification: (notification: Omit<GlobalNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  unreadNotificationCount: number;
  
  // Modal Management
  openModal: (type: string, props?: Record<string, any>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Loading State Management
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Search and Filters
  setGlobalSearch: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    'read:all',
    'write:all', 
    'delete:all',
    'manage:users',
    'manage:settings',
    'view:analytics',
    'manage:providers',
    'manage:pharmacies',
    'manage:products',
    'manage:discounts',
    'manage:resources',
    'manage:tags',
    'audit:logs'
  ],
  provider: [
    'read:patients',
    'write:patients',
    'read:sessions',
    'write:sessions',
    'read:orders',
    'write:orders',
    'read:messages',
    'write:messages',
    'read:tasks',
    'write:tasks',
    'read:calendar',
    'write:notes'
  ],
  patient: [
    'read:own_data',
    'write:own_data',
    'read:own_orders',
    'read:own_messages',
    'write:own_messages',
    'read:own_sessions'
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // UI State Management
  const [uiState, setUIState] = useState<UIState>({
    sidebarCollapsed: false,
    theme: 'system',
    notifications: [],
    modals: [],
    loadingStates: {},
    globalSearchQuery: '',
    activeFilters: {},
  });

  // Auth state listener - TEMPORARILY DISABLED
  useEffect(() => {
    // Immediately set a mock admin user to bypass login
    console.warn("Authentication is temporarily disabled. A mock admin user is being used.");
    const mockAdminUser: AuthUser = {
      uid: 'mock-admin-uid',
      email: 'admin@healthflow.dev',
      displayName: 'Admin User',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };
    setUser(mockAdminUser);
    setLoading(false);
  }, []);

  // Sign in function - will not be used while auth is disabled
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Demo mode authentication bypass for development
      if (email.includes('@zappy.com')) {
        console.log('🔓 Demo authentication mode');
        
        const role = email.includes('admin') ? 'admin' :
                     email.includes('provider') ? 'provider' :
                     'patient';
        const name = role.charAt(0).toUpperCase() + role.slice(1);

        // This object needs to match the structure of a real Firebase User object
        const demoUser: AuthUser = {
          uid: `demo-${role}`,
          email,
          displayName: `Demo ${name}`,
          emailVerified: true,
          isAnonymous: false,
          metadata: {}, // Mock metadata
          providerData: [],
          providerId: 'password',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => `demo-token-for-${role}`,
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({}),
          role: role as UserRole,
          firstName: 'Demo',
          lastName: name,
        };
        
        setUser(demoUser);
        toast({
          title: "Demo Login Successful",
          description: `Logged in as ${demoUser.role}`,
        });
        
        return;
      }
      
      // Real Firebase authentication for production
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await loadUserData(result.user);
      setUser(userData);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

    } catch (error: any) {
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<AuthUser>) => {
    toast({ title: "Auth Disabled", description: "Sign up is temporarily disabled." });
  };

  // Logout function
  const logout = async () => {
    toast({ title: "Auth Disabled", description: "Logout is temporarily disabled." });
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    toast({ title: "Auth Disabled", description: "Password reset is temporarily disabled." });
  };

  // Update user profile
  const updateUserProfile = async (userData: Partial<AuthUser>) => {
    toast({ title: "Auth Disabled", description: "Profile updates are temporarily disabled." });
  };

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  // UI State Management Functions
  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setUIState(prev => ({
      ...prev,
      theme
    }));
    // Apply theme to document
    if (typeof window !== "undefined") {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      }
    }
  }, []);

  // Notification Management Functions
  const addNotification = useCallback((notification: Omit<GlobalNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: GlobalNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setUIState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setUIState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  const unreadNotificationCount = uiState.notifications.filter(n => !n.read).length;

  // Modal Management Functions
  const openModal = useCallback((type: string, props: Record<string, any> = {}) => {
    const modalId = Date.now().toString();
    const newModal: Modal = {
      id: modalId,
      type,
      props,
      isOpen: true,
    };
    
    setUIState(prev => ({
      ...prev,
      modals: [...prev.modals, newModal]
    }));
    
    return modalId;
  }, []);

  const closeModal = useCallback((id: string) => {
    setUIState(prev => ({
      ...prev,
      modals: prev.modals.filter(modal => modal.id !== id)
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      modals: []
    }));
  }, []);

  // Loading State Management Functions
  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setUIState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [key]: isLoading
      }
    }));
  }, []);

  const isLoadingState = useCallback((key: string) => {
    return uiState.loadingStates[key] || false;
  }, [uiState.loadingStates]);

  // Search and Filter Functions
  const setGlobalSearch = useCallback((query: string) => {
    setUIState(prev => ({
      ...prev,
      globalSearchQuery: query
    }));
  }, []);

  const setFilter = useCallback((key: string, value: any) => {
    setUIState(prev => ({
      ...prev,
      activeFilters: {
        ...prev.activeFilters,
        [key]: value
      }
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      activeFilters: {}
    }));
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    hasRole,
    hasPermission,
    
    // UI State Management
    uiState,
    toggleSidebar,
    setTheme,
    
    // Notifications Management
    addNotification,
    markNotificationRead,
    clearNotifications,
    unreadNotificationCount,
    
    // Modal Management
    openModal,
    closeModal,
    closeAllModals,
    
    // Loading State Management
    setLoading: setLoadingState,
    isLoading: isLoadingState,
    
    // Search and Filters
    setGlobalSearch,
    setFilter,
    clearFilters,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for route protection
export const withAuth = (WrappedComponent: React.ComponentType, allowedRoles?: UserRole[]) => {
  return function AuthenticatedComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/');
        return;
      }

      if (!loading && user && allowedRoles && !allowedRoles.includes(user.role!)) {
        router.push('/unauthorized');
        return;
      }
    }, [user, loading, router]);

    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role!)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Hook for protected routes
export const useRequireAuth = (allowedRoles?: UserRole[]) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role!)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, loading, router, allowedRoles]);

  return { user, loading };
};
