
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AppUser } from '@/types/user';

export interface AuthUser extends AppUser, FirebaseUser {}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  // Function to load user data from Firestore
  const loadUserData = async (firebaseUser: User): Promise<AuthUser> => {
    const db = getFirebaseFirestore();
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      // Create user object with default role
      let userData: AuthUser = {
        ...firebaseUser,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: 'patient', // Default role
      };
      
      // If user document exists in Firestore, merge with additional data
      if (userDoc.exists()) {
        const firestoreData = userDoc.data() as Partial<AuthUser>;
        userData = {
          ...userData,
          ...firestoreData,
        };
      }
      
      return userData;
    } catch (error) {
      console.error('Error loading user data:', error);
      // Return basic user data if Firestore fails
      return {
        ...firebaseUser,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: 'patient',
      };
    }
  };

  useEffect(() => {
    // Mock Admin User to bypass login for development
    console.warn("Authentication is temporarily disabled. A mock admin user is being used.");
    const mockAdminUser: AuthUser = {
      uid: 'mock-admin-uid',
      email: 'admin@healthflow.dev',
      displayName: 'Admin User',
      emailVerified: true,
      isAnonymous: false,
      photoURL: '',
      providerData: [],
      metadata: {},
      providerId: 'password',
      // AppUser properties
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Dummy FirebaseUser methods
      delete: async () => {},
      getIdToken: async () => 'mock-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    } as AuthUser;

    setUser(mockAdminUser);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
<<<<<<< HEAD
    toast({ title: "Auth Disabled", description: "Login is temporarily disabled." });
=======
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
>>>>>>> 40cd9635a3c3d971e6aa9133d581f8bc7d167977
  };

  const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
    toast({ title: "Auth Disabled", description: "Sign up is temporarily disabled." });
  };

  const logout = async () => {
    setUser(null); // Mock logout
    router.push('/');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
