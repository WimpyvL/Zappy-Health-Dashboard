
"use client";

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  FirestoreError,
  writeBatch,
  getCountFromServer,
  WhereFilterOp
} from "firebase/firestore";
import { getFirebaseFirestore, isDevelopmentMode } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useMemo } from "react";
import { shouldUseDemoData, demoDataService } from "@/lib/demo-data";

// --- Enhanced Types ---

export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QueryOptions {
  filters?: Array<{
    field: string;
    op: WhereFilterOp;
    value: any;
  }>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDocument: DocumentSnapshot | null;
  total: number;
  error: string | null;
  success: boolean;
}

export interface Patient extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  status: "Active" | "Inactive" | "Pending";
  plan: string;
  lastActive: Timestamp;
  orders: number;
  tags: string[];
  phone?: string;
  dob?: Timestamp;
  address?: string;
  pharmacy?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  groupNumber?: string;
  insuranceHolder?: string;
}

export interface Session extends BaseDocument {
  patientName: string;
  patientId: string;
  patientEmail: string;
  type: string;
  date: Timestamp;
  plan: string;
  provider: string;
  status: "pending" | "in-progress" | "completed" | "cancelled" | "followup";
  flowId?: string;
  progressNotes?: string;
  assessmentAndPlan?: string;
}

export interface Provider extends BaseDocument {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  license: string;
  status: 'Active' | 'Inactive';
}

export interface Order extends BaseDocument {
  patientId: string;
  patientName: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress?: string;
  trackingNumber?: string;
}

// --- Enhanced Error Handling ---

const handleFirestoreError = (error: FirestoreError): string => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action';
    case 'not-found':
      return 'The requested document was not found';
    case 'unavailable':
      return 'The service is temporarily unavailable. Please try again';
    case 'deadline-exceeded':
      return 'The request timed out. Please try again';
    case 'resource-exhausted':
      return 'Too many requests. Please wait and try again';
    default:
      return error.message || 'An unexpected error occurred';
  }
};

// --- Enhanced Service Functions ---

const getCollection = async <T extends BaseDocument>(
  collectionName: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<T>> => {
  try {
    // Use demo data in development mode
    if (shouldUseDemoData()) {
      console.log(`📊 Using demo data for collection: ${collectionName}`, options);
      const result = await demoDataService.fetchCollection(collectionName, options);
      console.log(`📊 Demo data result for ${collectionName}:`, result);
      return {
        data: result.data as unknown as T[],
        total: result.total,
        hasMore: result.hasMore || false,
        lastDocument: null, // Demo mode doesn't need pagination cursors
        error: null,
        success: true,
      };
    }

    const { filters = [], sortBy = 'createdAt', sortDirection = 'desc', limit: pageSize = 25 } = options;
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    let q = query(collection(firestore, collectionName));

    // Apply filters
    filters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== null) {
        q = query(q, where(filter.field, filter.op, filter.value));
      }
    });

    // Apply ordering
    q = query(q, orderBy(sortBy, sortDirection));

    // Apply pagination
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    // Get one extra to check if there are more
    q = query(q, limit(pageSize + 1));

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    const hasMore = docs.length > pageSize;
    const dataSlice = hasMore ? docs.slice(0, -1) : docs;
    
    const data = dataSlice.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    return {
      data,
      hasMore,
      lastDocument: dataSlice.length > 0 ? (dataSlice[dataSlice.length - 1] as DocumentSnapshot) : null,
      total: data.length,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      hasMore: false,
      lastDocument: null,
      total: 0,
      error: handleFirestoreError(error as FirestoreError),
      success: false,
    };
  }
};

const getDocumentById = async <T extends BaseDocument>(
  collectionName: string,
  id: string
): Promise<DatabaseResponse<T>> => {
  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const docRef = doc(firestore, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        data: null,
        error: 'Document not found',
        success: false,
      };
    }

    return {
      data: { id: docSnap.id, ...docSnap.data() } as T,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: handleFirestoreError(error as FirestoreError),
      success: false,
    };
  }
};

const createDocument = async <T extends Record<string, any>>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DatabaseResponse<{ id: string }>> => {
  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const docRef = await addDoc(collection(firestore, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return {
      data: { id: docRef.id },
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: handleFirestoreError(error as FirestoreError),
      success: false,
    };
  }
};

const updateDocument = async <T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<DatabaseResponse<null>> => {
  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const docRef = doc(firestore, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: handleFirestoreError(error as FirestoreError),
      success: false,
    };
  }
};

const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<DatabaseResponse<null>> => {
  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: handleFirestoreError(error as FirestoreError),
      success: false,
    };
  }
};

// --- Query Keys Factory ---

export const queryKeys = {
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (options: QueryOptions) => [...queryKeys.patients.lists(), options] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (options: QueryOptions) => [...queryKeys.sessions.lists(), options] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },
  providers: {
    all: ['providers'] as const,
    lists: () => [...queryKeys.providers.all, 'list'] as const,
    list: (options: QueryOptions) => [...queryKeys.providers.lists(), options] as const,
    details: () => [...queryKeys.providers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.providers.details(), id] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (options: QueryOptions) => [...queryKeys.orders.lists(), options] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
};

// --- Enhanced React Query Hooks ---

// Generic hooks
export function useEntityList<T extends BaseDocument>(
  collectionName: string,
  options: QueryOptions = {},
  queryOptions?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [collectionName, 'list', options],
    queryFn: () => getCollection<T>(collectionName, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime)
    ...queryOptions,
  });
}

export function useEntityById<T extends BaseDocument>(
  collectionName: string,
  id: string | undefined,
  queryOptions?: Omit<UseQueryOptions<DatabaseResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DatabaseResponse<T>>({
    queryKey: [collectionName, 'detail', id],
    queryFn: () => getDocumentById<T>(collectionName, id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime)
    ...queryOptions,
  });
}

export function useCreateEntity<T extends Record<string, any>>(
  collectionName: string,
  options?: UseMutationOptions<DatabaseResponse<{ id: string }>, Error, Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => createDocument<T>(collectionName, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [collectionName, 'list'] });
        toast({
          title: "Success",
          description: "Item created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create item",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
    ...options,
  });
}

export function useUpdateEntity<T extends Record<string, any>>(
  collectionName: string,
  options?: UseMutationOptions<DatabaseResponse<null>, Error, { id: string } & Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateDocument<T>(collectionName, id, data as any),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [collectionName, 'list'] });
        queryClient.invalidateQueries({ queryKey: [collectionName, 'detail', variables.id] });
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update item",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
    ...options,
  });
}

export function useDeleteEntity(
  collectionName: string,
  options?: UseMutationOptions<DatabaseResponse<null>, Error, string>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(collectionName, id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [collectionName, 'list'] });
        queryClient.removeQueries({ queryKey: [collectionName, 'detail', id] });
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete item",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
    ...options,
  });
}

// --- Specific Entity Hooks ---

// Patients
export const usePatients = (options: QueryOptions = {}) => {
  const defaultOptions = { ...options, sortBy: options.sortBy || 'lastName' };
  return useEntityList<Patient>('patients', defaultOptions);
};

export const usePatientById = (id: string | undefined) => {
  return useEntityById<Patient>('patients', id);
};

export const useCreatePatient = () => {
  return useCreateEntity<Patient>('patients');
};

export const useUpdatePatient = () => {
  return useUpdateEntity<Patient>('patients');
};

export const useDeletePatient = () => {
  return useDeleteEntity('patients');
};

// Sessions
export const useSessions = (params: { status?: string; searchTerm?: string } = {}) => {
  const { status, searchTerm } = params;
  
  const options: QueryOptions = {
    sortBy: 'date',
    sortDirection: 'desc',
    filters: status ? [{ field: 'status', op: '==', value: status }] : [],
  };

  const query = useQuery({
    queryKey: ['sessions', 'list', { status, searchTerm }],
    queryFn: async (): Promise<{ data: Session[], meta: { total: number } }> => {
      const result = await getCollection<Session>('sessions', options);
      
      if (!result.success || !result.data) {
        return { data: [], meta: { total: 0 } };
      }

      // Apply client-side search filtering for backward compatibility
      if (searchTerm) {
        const filteredData = result.data.filter((session: Session) =>
          session.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return {
          data: filteredData,
          meta: { total: filteredData.length }
        };
      }

      return {
        data: result.data,
        meta: { total: result.total }
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Updated from cacheTime to gcTime
  });

  return query;
};

export const useSessionById = (id: string | undefined) => {
  return useEntityById<Session>('sessions', id);
};

export const useCreateSession = () => {
  return useCreateEntity<Session>('sessions');
};

export const useUpdateSession = () => {
  return useUpdateEntity<Session>('sessions');
};

export const useUpdateSessionStatus = () => {
  const updateMutation = useUpdateEntity<Session>('sessions');
  
  return {
    ...updateMutation,
    mutate: ({ sessionId, status }: { sessionId: string; status: Session['status'] }) => {
      updateMutation.mutate({ id: sessionId, status });
    }
  };
};

export const useDeleteSession = () => {
  return useDeleteEntity('sessions');
};

// Providers
export const useProviders = (options: QueryOptions = {}) => {
  return useEntityList<Provider>('providers', options);
};

export const useProviderById = (id: string | undefined) => {
  return useEntityById<Provider>('providers', id);
};

export const useCreateProvider = () => {
  return useCreateEntity<Provider>('providers');
};

export const useUpdateProvider = () => {
  return useUpdateEntity<Provider>('providers');
};

export const useDeleteProvider = () => {
  return useDeleteEntity('providers');
};

// Orders
export const useOrders = (options: QueryOptions = {}) => {
  return useEntityList<Order>('orders', options);
};

export const useOrderById = (id: string | undefined) => {
  return useEntityById<Order>('orders', id);
};

export const useCreateOrder = () => {
  return useCreateEntity<Order>('orders');
};

export const useUpdateOrder = () => {
  return useUpdateEntity<Order>('orders');
};

export const useDeleteOrder = () => {
  return useDeleteEntity('orders');
};


// Cache for collection queries (5 minute TTL)
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper functions
const getCacheKey = (collectionName: string, options?: QueryOptions): string => {
  return `${collectionName}:${JSON.stringify(options || {})}`;
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const invalidateCache = (collectionName?: string): void => {
  if (collectionName) {
    // Invalidate all cache entries for this collection
    for (const key of queryCache.keys()) {
      if (key.startsWith(`${collectionName}:`)) {
        queryCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    queryCache.clear();
  }
};

// Enhanced admin service functions with caching and optimizations
export const adminServices = {
  // Generic fetch function with caching
  async fetchCollection<T extends BaseDocument>(
    collectionName: string,
    options?: QueryOptions,
    useCache = true
  ): Promise<T[]> {
    const cacheKey = getCacheKey(collectionName, options);
    
    // Check cache first
    if (useCache && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)!;
      if (isCacheValid(cached.timestamp)) {
        return cached.data;
      }
      queryCache.delete(cacheKey);
    }

    const result = await getCollection<T>(collectionName, options);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data');
    }

    // Cache the result
    if (useCache) {
      queryCache.set(cacheKey, {
        data: result.data || [],
        timestamp: Date.now()
      });
    }

    return result.data || [];
  },

  // Paginated fetch with cursor support
  async fetchCollectionPaginated<T extends BaseDocument>(
    collectionName: string,
    options?: QueryOptions
  ): Promise<PaginatedResponse<T>> {
    const result = await getCollection<T>(collectionName, options);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data');
    }
    return result;
  },

  // Batch operations for better performance
  async batchCreate<T extends Record<string, any>>(
    collectionName: string,
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const batch = writeBatch(firestore);
    const collectionRef = collection(firestore, collectionName);

    items.forEach((item) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
    invalidateCache(collectionName);
  },

  // Generic create function
  async createEntity<T extends Record<string, any>>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const result = await createDocument<T>(collectionName, data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create entity');
    }
    invalidateCache(collectionName);
  },

  // Generic update function
  async updateEntity<T extends Record<string, any>>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const result = await updateDocument<T>(collectionName, id, data as any);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update entity');
    }
    invalidateCache(collectionName);
  },

  // Generic delete function
  async deleteEntity(collectionName: string, id: string): Promise<void> {
    const result = await deleteDocument(collectionName, id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete entity');
    }
    invalidateCache(collectionName);
  },

  // Batch delete for performance
  async batchDelete(collectionName: string, ids: string[]): Promise<void> {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const batch = writeBatch(firestore);
    
    ids.forEach((id) => {
      const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    const docRef = doc(firestore, collectionName, id);
      batch.delete(docRef);
    });

    await batch.commit();
    invalidateCache(collectionName);
  },

  // Search across multiple fields with optimized query
  async searchEntities<T extends BaseDocument>(
    collectionName: string,
    searchTerm: string,
    searchFields: string[] = ['name'],
    options?: QueryOptions
  ): Promise<T[]> {
    // For complex searches, we'll fetch and filter client-side
    // In production, consider using Algolia or similar for full-text search
    const data = await this.fetchCollection<T>(collectionName, options, false);
    
    if (!searchTerm.trim()) return data;

    const lowercaseSearch = searchTerm.toLowerCase();
    return data.filter((item: any) => {
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowercaseSearch);
      });
    });
  },

  // Get entity count efficiently
  async getEntityCount(collectionName: string, filters?: QueryOptions['filters']): Promise<number> {
    try {
      // Use aggregation query for count (requires Firestore v9.7+)
      const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    let q = query(collection(firestore, collectionName));
      
      if (filters) {
        filters.forEach((filter) => {
          if (filter.value !== undefined && filter.value !== null) {
            q = query(q, where(filter.field, filter.op, filter.value));
          }
        });
      }

      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      // Fallback to regular query if count aggregation fails
      const result = await this.fetchCollection(collectionName, {
        ...(filters && { filters }),
        limit: 1000 // Reasonable limit for counting
      }, false);
      return result.length;
    }
  },

  // Cache management
  invalidateCache
};

// Export dbService for backward compatibility
export const dbService = {
  // Collection operations
  getCollection,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  
  // Admin services
  ...adminServices,
  
  // Query utilities
  queryKeys,
};
