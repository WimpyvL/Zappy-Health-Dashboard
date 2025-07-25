/**
 * @fileoverview Centralized Database Service.
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
  Query,
  WhereFilterOp,
  OrderByDirection,
  onSnapshot
} from 'firebase/firestore';

// Type definitions
interface DatabaseError {
  message: string;
  code?: string;
}

interface DatabaseResponse<T> {
  data: T;
  error: DatabaseError | null;
}

interface DatabaseFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

interface QueryOptions {
  filters?: DatabaseFilter[];
  sortBy?: string;
  sortDirection?: OrderByDirection;
  pageSize?: number;
  startAfter?: any;
}

interface BaseDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EntityService<T extends BaseDocument> {
  getAll: (options?: QueryOptions) => Promise<DatabaseResponse<T[]>>;
  getById: (id: string) => Promise<DatabaseResponse<T | null>>;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DatabaseResponse<T | null>>;
  update: (id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>) => Promise<DatabaseResponse<T | null>>;
  delete: (id: string) => Promise<{ error: DatabaseError | null }>;
}

interface ReadOnlyEntityService<T extends BaseDocument> {
  getAll: (options?: QueryOptions) => Promise<DatabaseResponse<T[]>>;
}

interface TaskEntityService<T extends BaseDocument> {
  getAll: (options?: QueryOptions) => Promise<DatabaseResponse<T[]>>;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DatabaseResponse<T | null>>;
  delete: (id: string) => Promise<{ error: DatabaseError | null }>;
}

// Entity type definitions
interface Patient extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
}

interface Provider extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  licenseNumber: string;
  credentials: string[];
  availability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
}

interface Order extends BaseDocument {
  patientId: string;
  providerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress?: string;
  notes?: string;
}

interface Session extends BaseDocument {
  patientId: string;
  providerId: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: Date;
  duration?: number;
  notes?: string;
  prescription?: string;
  followUpRequired?: boolean;
}

interface Discount extends BaseDocument {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

interface Pharmacy extends BaseDocument {
  name: string;
  address: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  isActive: boolean;
  deliveryRadius?: number;
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

interface Product extends BaseDocument {
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  stockQuantity: number;
  isActive: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  tags?: string[];
}

interface Resource extends BaseDocument {
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'image';
  url: string;
  category: string;
  tags?: string[];
  isPublic: boolean;
  accessLevel: 'patient' | 'provider' | 'admin';
}

interface Tag extends BaseDocument {
  name: string;
  description?: string;
  color?: string;
  category: string;
  isActive: boolean;
}

interface Invoice extends BaseDocument {
  patientId: string;
  orderId?: string;
  sessionId?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  paymentMethod?: string;
  paidAt?: Date;
}

interface AuditLog extends BaseDocument {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

interface Task extends BaseDocument {
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date;
  tags?: string[];
}

interface Message extends BaseDocument {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  readAt?: Date;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

class DatabaseService {
  private db: Firestore | null;

  constructor() {
    this.db = getFirebaseFirestore();
    if (!this.db) {
      console.error("Firestore not initialized. Check Firebase configuration.");
    }
  }

  // Generic method to get a collection reference
  private _getCollection(collectionName: string): CollectionReference<DocumentData> | null {
<<<<<<< HEAD
    if (!this.db) {
        throw new Error("Firestore is not initialized.");
    }
=======
    if (!this.db) return null;
>>>>>>> dd48230f1490504a7bf658f14b4c77975720fb3c
    return collection(this.db, collectionName);
  }

  // --- Generic CRUD Methods ---

  /**
   * Fetches all documents from a collection, with optional filtering and pagination.
   */
  async getAll<T extends BaseDocument>(
    collectionName: string, 
    options: QueryOptions = {}
  ): Promise<DatabaseResponse<T[]>> {
    const coll = this._getCollection(collectionName);
    if (!coll) {
      return { 
        data: [], 
        error: { message: "Database not initialized" } 
      };
    }
    
    try {
      let q: Query<DocumentData> = query(coll);
      
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null) {
            q = query(q, where(filter.field, filter.op, filter.value));
          }
        });
      }

      if (options.sortBy) {
        q = query(q, orderBy(options.sortBy, options.sortDirection || 'asc'));
      }
      
      // Basic limit for safety
      if (options.pageSize) {
        q = query(q, limit(options.pageSize));
      }

      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convert Firestore timestamps to Date objects
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      })) as T[];
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      return { 
        data: [], 
        error: { 
          message: error.message || 'Unknown error occurred', 
          code: error.code 
        }
      };
    }
  }

  /**
   * Fetches a single document by its ID from a collection.
   */
  async getById<T extends BaseDocument>(
    collectionName: string, 
    id: string
  ): Promise<DatabaseResponse<T | null>> {
    if (!this.db) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      };
    }
    
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          data: { 
            id: docSnap.id, 
            ...data,
            // Convert Firestore timestamps to Date objects
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as T, 
          error: null 
        };
      }
      
      return { 
        data: null, 
        error: { message: "Document not found" }
      };
    } catch (error: any) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Unknown error occurred', 
          code: error.code 
        }
      };
    }
  }

  /**
   * Creates a new document in a collection.
   */
  async create<T extends BaseDocument>(
    collectionName: string, 
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseResponse<T | null>> {
    const coll = this._getCollection(collectionName);
    if (!coll) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      };
    }
    
    try {
      const now = new Date();
      const docRef = await addDoc(coll, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        return { 
          data: { 
            id: docSnap.id, 
            ...docData,
            createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
            updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
          } as T, 
          error: null 
        };
      }
      
      return { 
        data: null, 
        error: { message: "Failed to retrieve created document" }
      };
    } catch (error: any) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Unknown error occurred', 
          code: error.code 
        }
      };
    }
  }

  /**
   * Updates an existing document in a collection.
   */
  async update<T extends BaseDocument>(
    collectionName: string, 
    id: string, 
    data: Partial<Omit<T, 'id' | 'createdAt'>>
  ): Promise<DatabaseResponse<T | null>> {
    if (!this.db) {
      return { 
        data: null, 
        error: { message: "Database not initialized" } 
      };
    }
    
    try {
      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      
      const updatedDocSnap = await getDoc(docRef);
      if (updatedDocSnap.exists()) {
        const docData = updatedDocSnap.data();
        return { 
          data: { 
            id: updatedDocSnap.id, 
            ...docData,
            createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
            updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
          } as T, 
          error: null 
        };
      }
      
      return { 
        data: null, 
        error: { message: "Document not found after update" }
      };
    } catch (error: any) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Unknown error occurred', 
          code: error.code 
        }
      };
    }
  }

  /**
   * Deletes a document from a collection.
   */
  async delete(collectionName: string, id: string): Promise<{ error: DatabaseError | null }> {
    if (!this.db) {
      return { error: { message: "Database not initialized" } };
    }
    
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return { error: null };
    } catch (error: any) {
      console.error(`Error deleting document ${id} in ${collectionName}:`, error);
      return { 
        error: { 
          message: error.message || 'Unknown error occurred', 
          code: error.code 
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
  
  invoices: ReadOnlyEntityService<Invoice> = {
    getAll: (options) => this.getAll<Invoice>('invoices', options),
  };
  
  auditLogs: ReadOnlyEntityService<AuditLog> = {
    getAll: (options) => this.getAll<AuditLog>('audit_logs', options),
  };
  
  tasks: TaskEntityService<Task> = {
    getAll: (options) => this.getAll<Task>('tasks', options),
    create: (data) => this.create<Task>('tasks', data),
    delete: (id) => this.delete('tasks', id),
  };
  
  messages: TaskEntityService<Message> = {
    getAll: (options) => this.getAll<Message>('conversations', options),
    create: (data) => this.create<Message>('conversations', data),
    delete: (id) => this.delete('conversations', id),
  };
}

<<<<<<< HEAD
export const dbService = new DatabaseService();
export const databaseService = dbService; // For backward compatibility

const createServiceMethods = (collectionName: string) => ({
    getAll: (options: QueryOptions = {}) => dbService.getAll(collectionName, options),
    getById: (id: string) => dbService.getById(collectionName, id),
    create: (data: any) => dbService.create(collectionName, data),
    update: (id: string, data: any) => dbService.update(collectionName, id, data),
    delete: (id: string) => dbService.delete(collectionName, id),
    listen: (id: string, onUpdate: (data: any | null) => void) => dbService.listen(collectionName, id, onUpdate)
});

// Create specific service namespaces
dbService.patients = createServiceMethods('patients');
dbService.providers = createServiceMethods('providers');
dbService.orders = createServiceMethods('orders');
dbService.sessions = createServiceMethods('sessions');
dbService.discounts = createServiceMethods('discounts');
dbService.pharmacies = createServiceMethods('pharmacies');
dbService.products = createServiceMethods('products');
dbService.resources = createServiceMethods('resources');
dbService.tags = createServiceMethods('tags');
dbService.invoices = createServiceMethods('invoices');
dbService.auditLogs = createServiceMethods('audit_logs');
dbService.tasks = createServiceMethods('tasks');
dbService.messages = createServiceMethods('conversations');
dbService.insurance_documents = createServiceMethods('insurance_documents');
=======
export const databaseService = new DatabaseService();
export const dbService = databaseService; // Alias for backward compatibility
>>>>>>> dd48230f1490504a7bf658f14b4c77975720fb3c

// Export types for use in other parts of the application
export type {
  DatabaseError,
  DatabaseResponse,
  DatabaseFilter,
  QueryOptions,
  BaseDocument,
  EntityService,
  ReadOnlyEntityService,
  TaskEntityService,
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
};
