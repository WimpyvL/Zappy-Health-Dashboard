<<<<<<< HEAD

// src/lib/auth-context.tsx
=======
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a
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
<<<<<<< HEAD
import { AppUser, UserRole } from '@/types/user';
import { connectDataConnectEmulator, getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';
import { isDevelopment } from './utils';

export interface AuthUser extends AppUser, FirebaseUser {}
=======
import { useToast } from '@/hooks/use-toast';
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  dataConnect: DataConnect | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const signIn = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Sign in error:", error);
    let errorMessage = "An unknown error occurred during sign-in.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address is not valid.";
    }
    throw new Error(errorMessage);
  }
};

const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      authId: user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: user.email,
      role: 'patient',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error("Sign up error:", error);
    let errorMessage = "An unknown error occurred during sign-up.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already in use. Please log in or use a different email.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "The password is too weak. Please choose a stronger password.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address is not valid.";
    } else {
        errorMessage = `Sign-up failed: ${error.code}`;
    }
    throw new Error(errorMessage);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    // START: MOCK AUTHENTICATION
    const mockUser: AuthUser = {
      uid: 'mock-admin-user',
      email: 'admin@zappy.health',
      emailVerified: true,
=======
    // Immediately set a mock admin user to bypass login
    console.warn("Authentication is temporarily disabled. A mock admin user is being used.");
    const mockAdminUser: AuthUser = {
      uid: 'mock-admin-uid',
      email: 'admin@healthflow.dev',
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a
      displayName: 'Admin User',
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

    setUser(mockUser);
    setLoading(false);
    
    const dc = getDataConnect(connectorConfig);
    if (isDevelopment()) {
        connectDataConnectEmulator(dc, 'localhost', 9399);
    }
    setDataConnect(dc);
    // END: MOCK AUTHENTICATION
  }, []);

<<<<<<< HEAD
=======
  // Sign in function - will not be used while auth is disabled
  const signIn = async (email: string, password: string) => {
<<<<<<< HEAD
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
=======
    toast({ title: "Auth Disabled", description: "Login is temporarily disabled." });
>>>>>>> dd48230f1490504a7bf658f14b4c77975720fb3c
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<AuthUser>) => {
    toast({ title: "Auth Disabled", description: "Sign up is temporarily disabled." });
  };

  // Logout function
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a
  const logout = async () => {
    // await signOut(auth);
    setUser(null); // Mock logout
    router.push('/');
  };

  const hasPermission = (permission: string): boolean => {
    // With mock user, always return true for admin
    return user?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    hasPermission,
    dataConnect
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
