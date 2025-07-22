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
} from 'firebase/firestore';

class DatabaseService {
  constructor() {
    this.db = getFirebaseFirestore();
    if (!this.db) {
        console.error("Firestore not initialized. Check Firebase configuration.");
    }
  }

  // Generic method to get a collection reference
  _getCollection(collectionName) {
    if (!this.db) return null;
    return collection(this.db, collectionName);
  }

  // --- Generic CRUD Methods ---

  /**
   * Fetches all documents from a collection, with optional filtering and pagination.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {object} [options] - Filtering and pagination options.
   * @returns {Promise<{data: Array<object>, error: object|null}>}
   */
  async getAll(collectionName, options = {}) {
    const coll = this._getCollection(collectionName);
    if (!coll) return { data: [], error: { message: "Database not initialized" } };
    
    try {
      let q = query(coll);
      
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          if(filter.value) {
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

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data, error: null };
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      return { data: [], error: { message: error.message, code: error.code }};
    }
  }

  /**
   * Fetches a single document by its ID from a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to fetch.
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getById(collectionName, id) {
    if (!this.db) return { data: null, error: { message: "Database not initialized" } };
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      }
      return { data: null, error: { message: "Document not found" }};
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      return { data: null, error: { message: error.message, code: error.code }};
    }
  }

  /**
   * Creates a new document in a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {object} data - The data for the new document.
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async create(collectionName, data) {
    const coll = this._getCollection(collectionName);
    if (!coll) return { data: null, error: { message: "Database not initialized" } };
    try {
      const docRef = await addDoc(coll, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const docSnap = await getDoc(docRef);
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { data: null, error: { message: error.message, code: error.code }};
    }
  }

  /**
   * Updates an existing document in a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to update.
   * @param {object} data - The data to update.
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async update(collectionName, id, data) {
    if (!this.db) return { data: null, error: { message: "Database not initialized" } };
    try {
      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      const updatedDocSnap = await getDoc(docRef);
      return { data: { id: updatedDocSnap.id, ...updatedDocSnap.data() }, error: null };
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      return { data: null, error: { message: error.message, code: error.code }};
    }
  }

  /**
   * Deletes a document from a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to delete.
   * @returns {Promise<{error: object|null}>}
   */
  async delete(collectionName, id) {
    if (!this.db) return { error: { message: "Database not initialized" } };
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return { error: null };
    } catch (error) {
      console.error(`Error deleting document ${id} in ${collectionName}:`, error);
      return { error: { message: error.message, code: error.code }};
    }
  }

  // --- Specific Entity Services ---
  patients = {
    getAll: (options) => this.getAll('patients', options),
    getById: (id) => this.getById('patients', id),
    create: (data) => this.create('patients', data),
    update: (id, data) => this.update('patients', id, data),
    delete: (id) => this.delete('patients', id),
  };

  providers = {
    getAll: (options) => this.getAll('providers', options),
    getById: (id) => this.getById('providers', id),
    create: (data) => this.create('providers', data),
    update: (id, data) => this.update('providers', id, data),
    delete: (id) => this.delete('providers', id),
  };
  
  orders = {
    getAll: (options) => this.getAll('orders', options),
    getById: (id) => this.getById('orders', id),
    create: (data) => this.create('orders', data),
    update: (id, data) => this.update('orders', id, data),
    delete: (id) => this.delete('orders', id),
  };
  
  sessions = {
    getAll: (options) => this.getAll('sessions', options),
    getById: (id) => this.getById('sessions', id),
    create: (data) => this.create('sessions', data),
    update: (id, data) => this.update('sessions', id, data),
    delete: (id) => this.delete('sessions', id),
  };
  
  discounts = {
    getAll: (options) => this.getAll('discounts', options),
    getById: (id) => this.getById('discounts', id),
    create: (data) => this.create('discounts', data),
    update: (id, data) => this.update('discounts', id, data),
    delete: (id) => this.delete('discounts', id),
  };
  
  pharmacies = {
    getAll: (options) => this.getAll('pharmacies', options),
    getById: (id) => this.getById('pharmacies', id),
    create: (data) => this.create('pharmacies', data),
    update: (id, data) => this.update('pharmacies', id, data),
    delete: (id) => this.delete('pharmacies', id),
  };
  
  products = {
    getAll: (options) => this.getAll('products', options),
    getById: (id) => this.getById('products', id),
    create: (data) => this.create('products', data),
    update: (id, data) => this.update('products', id, data),
    delete: (id) => this.delete('products', id),
  };
  
  resources = {
    getAll: (options) => this.getAll('resources', options),
    getById: (id) => this.getById('resources', id),
    create: (data) => this.create('resources', data),
    update: (id, data) => this.update('resources', id, data),
    delete: (id) => this.delete('resources', id),
  };
  
  tags = {
    getAll: (options) => this.getAll('tags', options),
    getById: (id) => this.getById('tags', id),
    create: (data) => this.create('tags', data),
    update: (id, data) => this.update('tags', id, data),
    delete: (id) => this.delete('tags', id),
  };
  
  invoices = {
    getAll: (options) => this.getAll('invoices', options),
  };
  
  auditLogs = {
    getAll: (options) => this.getAll('audit_logs', options),
  };
  
  tasks = {
    getAll: (options) => this.getAll('tasks', options),
    create: (data) => this.create('tasks', data),
    delete: (id) => this.delete('tasks', id),
  };
  
  messages = {
    getAll: (options) => this.getAll('conversations', options),
    create: (data) => this.create('conversations', data),
  };
}

export const databaseService = new DatabaseService();