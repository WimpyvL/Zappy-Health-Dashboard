/**
 * Unified Database Service Layer
 * This replaces the three different database patterns with a single, type-safe approach
 */

import { getFirebaseFirestore } from '@/lib/firebase';
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
  QueryDocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';

// Common types
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QueryOptions {
  filters?: Array<{
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
  }>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
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

// Error handling utility
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

// Generic database service class
export class DatabaseService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection reference
  private getCollection() {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    return collection(firestore, this.collectionName);
  }

  // Get document reference
  private getDoc(id: string) {
    const firestore = getFirebaseFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    return doc(firestore, this.collectionName, id);
  }

  // Create document
  async create<T extends Record<string, any>>(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseResponse<{ id: string }>> {
    try {
      const docRef = await addDoc(this.getCollection(), {
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
  }

  // Get single document by ID
  async getById<T extends BaseDocument>(id: string): Promise<DatabaseResponse<T>> {
    try {
      const docRef = this.getDoc(id);
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
  }

  // Get multiple documents with query options
  async getMany<T extends BaseDocument>(
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      let q = query(this.getCollection());

      // Apply filters
      if (options.filters) {
        options.filters.forEach(({ field, operator, value }) => {
          if (value !== undefined && value !== null) {
            q = query(q, where(field, operator, value));
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply pagination
      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      // Apply limit
      const pageSize = options.limit || 25;
      q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      const hasMore = docs.length > pageSize;
      const dataSlice = hasMore ? docs.slice(0, -1) : docs;
      
      const data = dataSlice.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return {
        data,
        hasMore,
        lastDocument: dataSlice.length > 0 ? dataSlice[dataSlice.length - 1] : null,
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
  }

  // Update document
  async update<T extends Record<string, any>>(
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResponse<null>> {
    try {
      const docRef = this.getDoc(id);
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
  }

  // Delete document
  async delete(id: string): Promise<DatabaseResponse<null>> {
    try {
      const docRef = this.getDoc(id);
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
  }

  // Count documents (approximate)
  async count(options: Omit<QueryOptions, 'limit' | 'startAfter'> = {}): Promise<DatabaseResponse<number>> {
    try {
      // Note: Firestore doesn't have a direct count method, so we fetch all and count
      // In production, you'd want to use Firestore's count() method or maintain counters
      let q = query(this.getCollection());

      if (options.filters) {
        options.filters.forEach(({ field, operator, value }) => {
          if (value !== undefined && value !== null) {
            q = query(q, where(field, operator, value));
          }
        });
      }

      const snapshot = await getDocs(q);
      
      return {
        data: snapshot.size,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: 0,
        error: handleFirestoreError(error as FirestoreError),
        success: false,
      };
    }
  }

  // Batch operations
  async createMany<T extends Record<string, any>>(
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResponse<{ ids: string[] }>> {
    try {
      const promises = items.map(item => this.create(item));
      const results = await Promise.all(promises);
      
      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        return {
          data: null,
          error: `Failed to create ${failedResults.length} items`,
          success: false,
        };
      }

      return {
        data: { ids: results.map(r => r.data!.id) },
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
  }
}

// Pre-configured service instances
export const patientsService = new DatabaseService('patients');
export const sessionsService = new DatabaseService('sessions');
export const providersService = new DatabaseService('providers');
export const ordersService = new DatabaseService('orders');
export const invoicesService = new DatabaseService('invoices');
export const messagesService = new DatabaseService('messages');
export const tasksService = new DatabaseService('tasks');
export const auditLogsService = new DatabaseService('audit_logs');
export const pharmaciesService = new DatabaseService('pharmacies');
export const productsService = new DatabaseService('products');
export const discountsService = new DatabaseService('discounts');
export const resourcesService = new DatabaseService('resources');
export const tagsService = new DatabaseService('tags');

// Export singleton instance for backward compatibility
export const databaseService = {
  patients: patientsService,
  sessions: sessionsService,
  providers: providersService,
  orders: ordersService,
  invoices: invoicesService,
  messages: messagesService,
  tasks: tasksService,
  auditLogs: auditLogsService,
  pharmacies: pharmaciesService,
  products: productsService,
  discounts: discountsService,
  resources: resourcesService,
  tags: tagsService,
};