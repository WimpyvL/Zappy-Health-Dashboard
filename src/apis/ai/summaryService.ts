/**
 * @fileoverview Centralized Database Service with TypeScript support
 * This service acts as the single gateway for all Firestore database operations.
 * It abstracts the direct Firestore calls and provides a clean, consistent API
 * for different parts of the application to use.
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
  Firestore,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentReference,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';

// Type definitions for database operations
interface DatabaseError {
  message: string;
  code?: string;
}

interface DatabaseResult<T> {
  data: T;
  error: null;
}

interface DatabaseErrorResult {
  data: null;
  error: DatabaseError;
}

type DatabaseResponse<T> = DatabaseResult<T> | DatabaseErrorResult;

interface FilterOption {
  field: string;
  op: WhereFilterOp;
  value: any;
}

interface QueryOptions {
  filters?: FilterOption[];
  sortBy?: string;
  sortDirection?: OrderByDirection;
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot;
}

interface BaseDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Patient extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
}

interface Provider extends BaseDocument {
  name: string;
  email: string;
  specialty: string;
  licenseNumber?: string;
  phone?: string;
  isActive: boolean;
}

interface Order extends BaseDocument {
  patientId: string;
  providerId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress?: string;
}

interface Session extends BaseDocument {
  patientId: string;
  providerId: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: Date;
  duration?: number;
  notes?: string;
}

interface Discount extends BaseDocument {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
}

interface Pharmacy extends BaseDocument {
  name: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  licenseNumber?: string;
}

interface Product extends BaseDocument {
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  inventory?: number;
  sku?: string;
}

interface Resource extends BaseDocument {
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'form_template';
  content?: string;
  url?: string;
  category: string;
  isPublished: boolean;
}

interface Tag extends BaseDocument {
  name: string;
  color?: string;
  category?: string;
  isActive: boolean;
}

interface Invoice extends BaseDocument {
  patientId: string;
  orderId?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface AuditLog extends BaseDocument {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
}

interface Task extends BaseDocument {
  title: string;
  description?: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
}

interface Message extends BaseDocument {
  senderId: string;
  recipientId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  threadId?: string;
}

// Entity service interface
interface EntityService<T extends BaseDocument> {
  getAll: (options?: QueryOptions) => Promise<DatabaseResponse<T[]>>;
  getById: (id: string) => Promise<DatabaseResponse<T | null>>;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DatabaseResponse<T>>;
  update: (id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<DatabaseResponse<T>>;
  delete: (id: string) => Promise<{ error: DatabaseError | null }>;
}

class DatabaseService {
  private db: Firestore | null;

  constructor() {
    this.db = getFirebaseFirestore();
    if (!this.db) {
      console.error("Firestore not initialized. Check Firebase configuration.");
    }
  }

  /**
   * Generic method to get a collection reference
   * @param collectionName - The name of the collection
   * @returns Collection reference or null if database not initialized
   */
  private _getCollection(collectionName: string): CollectionReference<DocumentData> | null {
    if (!this.db) return null;
    return collection(this.db, collectionName);
  }

  // --- Generic CRUD Methods ---

  /**
   * Fetches all documents from a collection, with optional filtering and pagination.
   * @param collectionName - The name of the Firestore collection
   * @param options - Filtering and pagination options
   * @returns Promise with data array and error information
   */
  async getAll<T extends BaseDocument>(
    collectionName: string, 
    options: QueryOptions = {}
  ): Promise<DatabaseResponse<T[]>> {
    const coll = this._getCollection(collectionName);
    if (!coll) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      } as DatabaseErrorResult;
    }
    
    try {
      let q = query(coll);
      
      // Apply filters
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null) {
            q = query(q, where(filter.field, filter.op, filter.value));
          }
        });
      }

      // Apply sorting
      if (options.sortBy) {
        q = query(q, orderBy(options.sortBy, options.sortDirection || 'asc'));
      }
      
      // Apply pagination
      if (options.pageSize) {
        q = query(q, limit(options.pageSize));
      }

      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      })) as T[];
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        data: null, 
        error: { 
          message: errorMessage, 
          code: (error as any)?.code 
        } 
      } as DatabaseErrorResult;
    }
  }

  /**
   * Fetches a single document by its ID from a collection.
   * @param collectionName - The name of the Firestore collection
   * @param id - The ID of the document to fetch
   * @returns Promise with document data and error information
   */
  async getById<T extends BaseDocument>(
    collectionName: string, 
    id: string
  ): Promise<DatabaseResponse<T | null>> {
    if (!this.db) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      } as DatabaseErrorResult;
    }

    try {
      const docRef: DocumentReference<DocumentData> = doc(this.db, collectionName, id);
      const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.() || docSnap.data().updatedAt,
        } as T;
        
        return { data, error: null };
      }
      
      return { 
        data: null, 
        error: null 
      } as DatabaseResult<null>;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        data: null, 
        error: { 
          message: errorMessage, 
          code: (error as any)?.code 
        } 
      } as DatabaseErrorResult;
    }
  }

  /**
   * Creates a new document in a collection.
   * @param collectionName - The name of the Firestore collection
   * @param data - The data for the new document
   * @returns Promise with created document data and error information
   */
  async create<T extends BaseDocument>(
    collectionName: string, 
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseResponse<T>> {
    const coll = this._getCollection(collectionName);
    if (!coll) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      } as DatabaseErrorResult;
    }

    try {
      const now = new Date();
      const docRef: DocumentReference<DocumentData> = await addDoc(coll, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      
      const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);
      const createdData = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: now,
        updatedAt: now,
      } as T;
      
      return { data: createdData, error: null };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        data: null, 
        error: { 
          message: errorMessage, 
          code: (error as any)?.code 
        } 
      } as DatabaseErrorResult;
    }
  }

  /**
   * Updates an existing document in a collection.
   * @param collectionName - The name of the Firestore collection
   * @param id - The ID of the document to update
   * @param data - The data to update
   * @returns Promise with updated document data and error information
   */
  async update<T extends BaseDocument>(
    collectionName: string, 
    id: string, 
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResponse<T>> {
    if (!this.db) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      } as DatabaseErrorResult;
    }

    try {
      const docRef: DocumentReference<DocumentData> = doc(this.db, collectionName, id);
      const now = new Date();
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: now,
      });
      
      const updatedDocSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);
      const updatedData = {
        id: updatedDocSnap.id,
        ...updatedDocSnap.data(),
        createdAt: updatedDocSnap.data()?.createdAt?.toDate?.() || updatedDocSnap.data()?.createdAt,
        updatedAt: now,
      } as T;
      
      return { data: updatedData, error: null };
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        data: null, 
        error: { 
          message: errorMessage, 
          code: (error as any)?.code 
        } 
      } as DatabaseErrorResult;
    }
  }

  /**
   * Deletes a document from a collection.
   * @param collectionName - The name of the Firestore collection
   * @param id - The ID of the document to delete
   * @returns Promise with error information
   */
  async delete(collectionName: string, id: string): Promise<{ error: DatabaseError | null }> {
    if (!this.db) {
      return { error: { message: "Database not initialized" } };
    }

    try {
      const docRef: DocumentReference<DocumentData> = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return { error: null };
    } catch (error) {
      console.error(`Error deleting document ${id} in ${collectionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        error: { 
          message: errorMessage, 
          code: (error as any)?.code 
        } 
      };
    }
  }

  // --- Specific Entity Services ---
  
  patients: EntityService<Patient> = {
    getAll: (options) => this.getAll<Patient>('patients', options),
    getById: (id) => this.getById<Patient>('patients', id),
    create: (data) => this.create<Patient>('patients', data),
    update: (id, data) => this.update<Patient>('patients', id, data),
    delete: (id) => this.delete('patients', id),
  };

  providers: EntityService<Provider> = {
    getAll: (options) => this.getAll<Provider>('providers', options),
    getById: (id) => this.getById<Provider>('providers', id),
    create: (data) => this.create<Provider>('providers', data),
    update: (id, data) => this.update<Provider>('providers', id, data),
    delete: (id) => this.delete('providers', id),
  };
  
  orders: EntityService<Order> = {
    getAll: (options) => this.getAll<Order>('orders', options),
    getById: (id) => this.getById<Order>('orders', id),
    create: (data) => this.create<Order>('orders', data),
    update: (id, data) => this.update<Order>('orders', id, data),
    delete: (id) => this.delete('orders', id),
  };
  
  sessions: EntityService<Session> = {
    getAll: (options) => this.getAll<Session>('sessions', options),
    getById: (id) => this.getById<Session>('sessions', id),
    create: (data) => this.create<Session>('sessions', data),
    update: (id, data) => this.update<Session>('sessions', id, data),
    delete: (id) => this.delete('sessions', id),
  };
  
  discounts: EntityService<Discount> = {
    getAll: (options) => this.getAll<Discount>('discounts', options),
    getById: (id) => this.getById<Discount>('discounts', id),
    create: (data) => this.create<Discount>('discounts', data),
    update: (id, data) => this.update<Discount>('discounts', id, data),
    delete: (id) => this.delete('discounts', id),
  };
  
  pharmacies: EntityService<Pharmacy> = {
    getAll: (options) => this.getAll<Pharmacy>('pharmacies', options),
    getById: (id) => this.getById<Pharmacy>('pharmacies', id),
    create: (data) => this.create<Pharmacy>('pharmacies', data),
    update: (id, data) => this.update<Pharmacy>('pharmacies', id, data),
    delete: (id) => this.delete('pharmacies', id),
  };
  
  products: EntityService<Product> = {
    getAll: (options) => this.getAll<Product>('products', options),
    getById: (id) => this.getById<Product>('products', id),
    create: (data) => this.create<Product>('products', data),
    update: (id, data) => this.update<Product>('products', id, data),
    delete: (id) => this.delete('products', id),
  };
  
  resources: EntityService<Resource> = {
    getAll: (options) => this.getAll<Resource>('resources', options),
    getById: (id) => this.getById<Resource>('resources', id),
    create: (data) => this.create<Resource>('resources', data),
    update: (id, data) => this.update<Resource>('resources', id, data),
    delete: (id) => this.delete('resources', id),
  };
  
  tags: EntityService<Tag> = {
    getAll: (options) => this.getAll<Tag>('tags', options),
    getById: (id) => this.getById<Tag>('tags', id),
    create: (data) => this.create<Tag>('tags', data),
    update: (id, data) => this.update<Tag>('tags', id, data),
    delete: (id) => this.delete('tags', id),
  };
  
  // Read-only services for specific collections
  invoices = {
    getAll: (options?: QueryOptions) => this.getAll<Invoice>('invoices', options),
    getById: (id: string) => this.getById<Invoice>('invoices', id),
  };
  
  auditLogs = {
    getAll: (options?: QueryOptions) => this.getAll<AuditLog>('audit_logs', options),
    getById: (id: string) => this.getById<AuditLog>('audit_logs', id),
  };
  
  tasks = {
    getAll: (options?: QueryOptions) => this.getAll<Task>('tasks', options),
    getById: (id: string) => this.getById<Task>('tasks', id),
    create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => this.create<Task>('tasks', data),
    update: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => this.update<Task>('tasks', id, data),
    delete: (id: string) => this.delete('tasks', id),
  };
  
  messages = {
    getAll: (options?: QueryOptions) => this.getAll<Message>('conversations', options),
    getById: (id: string) => this.getById<Message>('conversations', id),
    create: (data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) => this.create<Message>('conversations', data),
    update: (id: string, data: Partial<Omit<Message, 'id' | 'createdAt' | 'updatedAt'>>) => this.update<Message>('conversations', id, data),
    delete: (id: string) => this.delete('conversations', id),
  };

  /**
   * Batch operations for better performance
   * @param operations - Array of operations to perform
   * @returns Promise with results of all operations
   */
  async batchOperations<T extends BaseDocument>(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      id?: string;
      data?: Partial<T>;
    }>
  ): Promise<{
    results: Array<DatabaseResponse<T> | { error: DatabaseError | null }>;
    errors: DatabaseError[];
  }> {
    const results: Array<DatabaseResponse<T> | { error: DatabaseError | null }> = [];
    const errors: DatabaseError[] = [];

    for (const operation of operations) {
      try {
        let result: DatabaseResponse<T> | { error: DatabaseError | null };
        
        switch (operation.type) {
          case 'create':
            if (!operation.data) {
              throw new Error('Data is required for create operation');
            }
            result = await this.create<T>(operation.collection, operation.data as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
            break;
          case 'update':
            if (!operation.id || !operation.data) {
              throw new Error('ID and data are required for update operation');
            }
            result = await this.update<T>(operation.collection, operation.id, operation.data);
            break;
          case 'delete':
            if (!operation.id) {
              throw new Error('ID is required for delete operation');
            }
            result = await this.delete(operation.collection, operation.id);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push(result);
        
        if ('error' in result && result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const dbError = { message: errorMessage };
        errors.push(dbError);
        results.push({ error: dbError });
      }
    }

    return { results, errors };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export types for use in other parts of the application
export type {
  DatabaseError,
  DatabaseResult,
  DatabaseErrorResult,
  DatabaseResponse,
  FilterOption,
  QueryOptions,
  BaseDocument,
  Patient,
  Provider,
  Order,
  Session,
  Discount,
  Pharmacy,
  Product,
  Resource,
  Tag,
  Invoice,
  AuditLog,
  Task,
  Message,
  EntityService,
};
