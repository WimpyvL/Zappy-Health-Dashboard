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
export interface AuthUser extends User {
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

  // Load user data from Firestore
  const loadUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      const firestore = getFirebaseFirestore();
      if (!firestore) {
        console.warn('Firestore not initialized, skipping user document fetch');
        setUser(null);
        setLoading(false);
        return;
      }
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          ...firebaseUser,
          role: userData.role || 'patient',
          firstName: userData.firstName,
          lastName: userData.lastName,
          specialty: userData.specialty,
          license: userData.license,
        } as AuthUser;
      } else {
        // Create default user document for new users
        const defaultUserData = {
          email: firebaseUser.email,
          role: 'patient' as UserRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(userDocRef, defaultUserData);
        return {
          ...firebaseUser,
          role: 'patient',
        } as AuthUser;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      return {
        ...firebaseUser,
        role: 'patient',
      } as AuthUser;
    }
  };

  // Auth state listener
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('Firebase Auth not initialized');
      setLoading(false);
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await loadUserData(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Demo mode authentication bypass for development
      if (email.includes('@healthflow.com')) {
        console.log('🔓 Demo authentication mode');
        
        // Create mock user for demo purposes
        const demoUser = {
          uid: `demo-${email.split('@')[0]}`,
          email,
          displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          role: email.includes('admin') ? 'admin' as UserRole :
                email.includes('provider') ? 'provider' as UserRole :
                'patient' as UserRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setUser(demoUser);
        toast({
          title: "Demo Login Successful",
          description: `Logged in as ${demoUser.role}`,
        });

        // Redirect based on role
        switch (demoUser.role) {
          case 'admin':
          case 'provider':
            router.push('/dashboard');
            break;
          case 'patient':
            router.push('/dashboard/shop');
            break;
          default:
            router.push('/dashboard');
        }
        return { user: demoUser };
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

      // Redirect based on role
      switch (userData.role) {
        case 'admin':
        case 'provider':
          router.push('/dashboard');
          break;
        case 'patient':
          router.push('/dashboard/shop');
          break;
        default:
          router.push('/dashboard');
      }
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

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<AuthUser>) => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      if (userData.firstName && userData.lastName) {
        await updateProfile(result.user, {
          displayName: `${userData.firstName} ${userData.lastName}`,
        });
      }

      // Create user document in Firestore
      const userDocData = {
        email,
        role: userData.role || 'patient',
        firstName: userData.firstName,
        lastName: userData.lastName,
        specialty: userData.specialty,
        license: userData.license,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const firestore = getFirebaseFirestore();
      if (firestore) {
        await setDoc(doc(firestore, 'users', result.user.uid), userDocData);
      }
      
      const completeUserData = await loadUserData(result.user);
      setUser(completeUserData);

      toast({
        title: "Account Created",
        description: "Your account has been successfully created.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters';
          break;
      }

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      await signOut(auth);
      setUser(null);
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      await sendPasswordResetEmail(auth, email);
      
      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
      }

      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    }
  };

  // Update user profile
  const updateUserProfile = async (userData: Partial<AuthUser>) => {
    if (!user) throw new Error('No user signed in');

    try {
      setLoading(true);
      
      // Update Firestore document
      const firestore = getFirebaseFirestore();
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        ...userData,
        updatedAt: new Date(),
      }, { merge: true });

      // Update Firebase Auth profile if display name changed
      if (userData.firstName && userData.lastName) {
        await updateProfile(user, {
          displayName: `${userData.firstName} ${userData.lastName}`,
        });
      }

      // Reload user data
      const updatedUser = await loadUserData(user);
      setUser(updatedUser);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
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
        router.push('/login');
        setUser(null);
        setLoading(false);
        return;
      }

      if (!loading && user && allowedRoles && !allowedRoles.includes(user.role!)) {
        router.push('/unauthorized');
        setUser(null);
        setLoading(false);
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
      router.push('/login');
      setUser(null);
        setLoading(false);
        return;
    }

    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role!)) {
      router.push('/unauthorized');
      setUser(null);
        setLoading(false);
        return;
    }
  }, [user, loading, router, allowedRoles]);

  return { user, loading };
};