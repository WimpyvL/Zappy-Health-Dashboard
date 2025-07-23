// src/lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { getDataConnect, connectDataConnectEmulator, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';

export type UserRole = 'admin' | 'provider' | 'patient';

export interface AuthUser extends User {
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  dataConnect: DataConnect | null;
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
  const [dataConnect, setDataConnect] = useState<DataConnect | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let dc: DataConnect;
    try {
        dc = getDataConnect(connectorConfig);
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
            connectDataConnectEmulator(dc, '127.0.0.1', 9399);
        }
        setDataConnect(dc);
    } catch (e) {
        console.warn("Could not initialize DataConnect.", e);
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...firebaseUser, ...userData } as AuthUser);
        } else {
          // Handle case where user exists in Auth but not Firestore
          setUser(firebaseUser as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile display name in Firebase Auth
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        authId: user.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: user.email,
        role: 'patient', // Default role for new sign-ups
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Provide a more user-friendly error message
      let errorMessage = "An unknown error occurred during sign-up.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use. Please log in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      } else if (error.code === 'auth/invalid-credential') {
         errorMessage = "There was an issue creating your account. Please check your details and try again.";
      }

      // Throw the refined error to be caught by the form handler
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const hasPermission = (permission: string): boolean => {
    // In a real app, this would be more complex.
    // For now, only admins have all permissions.
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    dataConnect,
    signIn,
    signUp,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
