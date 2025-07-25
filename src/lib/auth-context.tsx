
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
    toast({ title: "Auth Disabled", description: "Login is temporarily disabled." });
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
