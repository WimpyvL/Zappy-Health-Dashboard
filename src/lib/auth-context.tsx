
// src/lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  connectAuthEmulator
} from 'firebase/auth';
import { getDoc, setDoc, doc, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { db, auth, isDevelopment } from './firebase';
import { useRouter } from 'next/navigation';
import { AppUser, UserRole } from '@/types/user';
import { connectDataConnectEmulator, getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';

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
    try {
      const dc = getDataConnect(connectorConfig);
      if (isDevelopment) {
        connectDataConnectEmulator(dc, 'localhost', 9399, true);
      }
      setDataConnect(dc);
    } catch (e) {
      console.error("Failed to initialize DataConnect", e);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          setUser({ ...firebaseUser, ...userData } as AuthUser);
        } else {
          // This is a new user who just signed up, create their doc if it doesn't exist
          // This case might happen if signup page and auth context are out of sync.
          // Fallback to creating a basic patient profile.
          const basicUserData = {
            authId: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'patient' as UserRole,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          await setDoc(userDocRef, basicUserData);
          setUser({ ...firebaseUser, ...basicUserData } as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
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
    dataConnect
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
