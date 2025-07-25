
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
import { db, auth, getFirebaseAuth, getFirebaseFirestore } from './firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AppUser, UserRole } from '@/types/user';

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
  
  const loadUserData = async (firebaseUser: FirebaseUser): Promise<AuthUser> => {
    const db = getFirebaseFirestore();
    if (!db) throw new Error('Firestore not initialized');
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      let userData: AuthUser = {
        ...(firebaseUser as any),
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        role: 'patient',
      };
      
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
      return {
        ...(firebaseUser as any),
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
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
    try {
      setLoading(true);
      
      if (email.includes('@zappy.com')) {
        console.log('🔓 Demo authentication mode');
        
        const role = email.includes('admin') ? 'admin' :
                     email.includes('provider') ? 'provider' :
                     'patient';
        const name = role.charAt(0).toUpperCase() + role.slice(1);

        const demoUser: AuthUser = {
          uid: `demo-${role}`,
          email,
          displayName: `Demo ${name}`,
          emailVerified: true,
          isAnonymous: false,
          metadata: {}, 
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
        } as AuthUser;
        
        setUser(demoUser);
        toast({
          title: "Demo Login Successful",
          description: `Logged in as ${demoUser.role}`,
        });
        
        return;
      }
      
      const authInstance = getFirebaseAuth();
      if (!authInstance) {
        throw new Error('Firebase Auth not initialized');
      }
      const result = await signInWithEmailAndPassword(authInstance, email, password);
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
