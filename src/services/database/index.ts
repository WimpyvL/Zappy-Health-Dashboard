/**
 * @fileoverview Centralized Database Service (TypeScript).
 * This service acts as the single gateway for all Firestore database operations,
 * using the new best-practice Firebase initialization.
 */

import { db } from '@/lib/firebase';
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
  Timestamp,
  WhereFilterOp,
  onSnapshot
} from 'firebase/firestore';

// --- Generic Types ---
interface DocumentData {
  id: string;
  [key: string]: any;
}

interface QueryFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

interface QueryOptions {
  filters?: QueryFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  pageSize?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

// --- Database Service Class ---
class DatabaseService {
  private db = db;

  private _getCollection(collectionName: string) {
    if (!this.db) {
        throw new Error("Firestore is not initialized.");
    }
    return collection(this.db, collectionName);
  }

  async getAll<T extends DocumentData>(collectionName: string, options: QueryOptions = {}): Promise<ApiResponse<T[]>> {
    try {
      let q = query(this._getCollection(collectionName));

      if (options.filters) {
        options.filters.forEach(filter => {
          if (filter.value !== undefined && filter.value !== null) {
            q = query(q, where(filter.field, filter.op, filter.value));
          }
        });
      }

      if (options.sortBy) {
        q = query(q, orderBy(options.sortBy, options.sortDirection || 'asc'));
      }

      q = query(q, limit(options.pageSize || 25));

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      return { data };
    } catch (error: any) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      return { data: null, error: error.message };
    }
  }

  async getById<T extends DocumentData>(collectionName: string, id: string): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() } as T };
      }
      return { data: null, error: 'Document not found' };
    } catch (error: any) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      return { data: null, error: error.message };
    }
  }

  async create<T extends object>(collectionName: string, data: T): Promise<ApiResponse<DocumentData>> {
    try {
      const docRef = await addDoc(this._getCollection(collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      const docSnap = await getDoc(docRef);
      return { data: { id: docSnap.id, ...docSnap.data() } };
    } catch (error: any) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { data: null, error: error.message };
    }
  }

  async update(collectionName: string, id: string, data: Partial<unknown>): Promise<ApiResponse<DocumentData>> {
    try {
      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
      const updatedDocSnap = await getDoc(docRef);
      return { data: { id: updatedDocSnap.id, ...updatedDocSnap.data() } };
    } catch (error: any) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      return { data: null, error: error.message };
    }
  }

  async delete(collectionName: string, id: string): Promise<ApiResponse<null>> {
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return { data: null };
    } catch (error: any) {
      console.error(`Error deleting document ${id} in ${collectionName}:`, error);
      return { data: null, error: error.message };
    }
  }

  listen<T extends DocumentData>(collectionName: string, id: string, onUpdate: (data: T | null) => void): () => void {
    const docRef = doc(this.db, collectionName, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        onUpdate({ id: doc.id, ...doc.data() } as T);
      } else {
        onUpdate(null);
      }
    });
  }
}

export const dbService = new DatabaseService();

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
