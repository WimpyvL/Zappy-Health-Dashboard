
// src/lib/auth-context.tsx
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
import { AppUser, UserRole } from '@/types/user';
import { connectDataConnectEmulator, getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';
import { isDevelopment } from './utils';

export interface AuthUser extends AppUser, FirebaseUser {}

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
  const [dataConnect, setDataConnect] = useState<DataConnect | null>(null);
  const router = useRouter();

  useEffect(() => {
    // START: MOCK AUTHENTICATION
    const mockUser: AuthUser = {
      uid: 'mock-admin-user',
      email: 'admin@zappy.health',
      emailVerified: true,
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

    /*
    // START: REAL AUTHENTICATION (Commented out)
    const dc = getDataConnect(connectorConfig);
    if (isDevelopment()) {
        connectDataConnectEmulator(dc, 'localhost', 9399);
    }
    setDataConnect(dc);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          setUser({ ...firebaseUser, ...userData } as AuthUser);
          if (userData.role === 'admin' || userData.role === 'provider') {
            router.push('/dashboard');
          } else {
            router.push('/my-services');
          }
        } else {
          // This might be a new user, handle appropriately or log out
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // END: REAL AUTHENTICATION
    */
  }, []);

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
