
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, query, orderBy, where, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- Service Functions ---

const getCollection = async (collectionName: string, options: any = {}) => {
  const { filters = [], sortBy = 'createdAt', sortDirection = 'desc' } = options;
  let q = query(collection(db, collectionName), orderBy(sortBy, sortDirection));

  filters.forEach((filter: any) => {
    if (filter.value !== undefined && filter.value !== null) {
      q = query(q, where(filter.field, filter.op, filter.value));
    }
  });

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createDocument = async (collectionName: string, data: any) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

const updateDocument = async (collectionName: string, id: string, data: any) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};


// Type definitions
export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "Active" | "Inactive" | "Pending";
  plan: string;
  lastActive: string;
  orders: number;
  tags: string[];
  phone?: string;
  dob?: Date;
  address?: string;
  pharmacy?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  groupNumber?: string;
  insuranceHolder?: string;
};

export type Session = {
    id: string;
    patientName: string;
    patientId: string;
    patientEmail: string;
    type: string;
    date: string;
    plan: string;
    provider: string;
    status: "pending" | "in-progress" | "completed" | "cancelled" | "followup";
  };
  

// --- React Query Hooks ---

// Patients
export const usePatients = () => {
  return useQuery<Patient[], Error>({
    queryKey: ["patients"],
    queryFn: () => getCollection("patients", { sortBy: 'lastName' }),
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, Omit<Patient, 'id'>>({
    mutationFn: (patientData) => createDocument("patients", patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Partial<Patient> & { id: string }>({
    mutationFn: (patientData) => updateDocument("patients", patientData.id, patientData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.id] });
    },
  });
};

// Sessions
export const useSessions = (params: any = {}, pageSize: number = 10) => {
  const { status, searchTerm } = params;
  
  const queryKey = ['sessions', { status, searchTerm, pageSize }];

  return useQuery<{ data: Session[], meta: any }, Error>({
      queryKey,
      queryFn: async () => {
          const filters = [];
          if (status) filters.push({ field: 'status', op: '==', value: status });
          
          const data = await getCollection("sessions", { sortBy: 'date', sortDirection: 'desc', filters });
          
          let filteredData = data;
          if (searchTerm) {
              const lowercasedFilter = searchTerm.toLowerCase();
              filteredData = data.filter((session: any) =>
                session.patientName?.toLowerCase().includes(lowercasedFilter) ||
                session.type?.toLowerCase().includes(lowercasedFilter)
              );
          }

          return { data: filteredData as Session[], meta: { total: filteredData.length }};
      }
  });
};


export const useUpdateSessionStatus = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { sessionId: string; status: Session['status'] }>({
        mutationFn: ({ sessionId, status }) => updateDocument("sessions", sessionId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
    });
};
