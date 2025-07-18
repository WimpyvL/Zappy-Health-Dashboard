
/**
 * @fileoverview Centralized Database Service.
 * This service acts as the single gateway for all Firestore database operations.
 * It abstracts the direct Firestore calls and provides a clean, consistent API
 * for different parts of the application to use.
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
  startAfter,
} from 'firebase/firestore';

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // Generic method to get a collection reference
  _getCollection(collectionName) {
    return collection(this.db, collectionName);
  }

  // --- Generic CRUD Methods ---

  /**
   * Fetches all documents from a collection, with optional filtering and pagination.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {object} [options] - Filtering and pagination options.
   * @returns {Promise<Array<object>>}
   */
  async getAll(collectionName, options = {}) {
    try {
      let q = query(this._getCollection(collectionName));
      
      if (options.filters) {
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
      q = query(q, limit(options.pageSize || 25));

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data, meta: { total: data.length }};
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single document by its ID from a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to fetch.
   * @returns {Promise<object|null>}
   */
  async getById(collectionName, id) {
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }};
      }
      return { data: null, error: { message: "Document not found" }};
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new document in a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {object} data - The data for the new document.
   * @returns {Promise<object>}
   */
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(this._getCollection(collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const docSnap = await getDoc(docRef);
      return { data: { id: docSnap.id, ...docSnap.data() } };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing document in a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to update.
   * @param {object} data - The data to update.
   * @returns {Promise<object>}
   */
  async update(collectionName, id, data) {
    try {
      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      const updatedDocSnap = await getDoc(docRef);
      return { data: { id: updatedDocSnap.id, ...updatedDocSnap.data() } };
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a document from a collection.
   * @param {string} collectionName - The name of the Firestore collection.
   * @param {string} id - The ID of the document to delete.
   * @returns {Promise<void>}
   */
  async delete(collectionName, id) {
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
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
    update: (id, data) => this.update('sessions', id, data),
  };
  
  alerts = {
    getAll: (options) => this.getAll('alerts', options),
  }

  payments = {
    getAll: (options) => this.getAll('payments', options),
  }

  consultations = {
    getAll: (options) => this.getAll('consultations', options),
  }
}

export const dbService = new DatabaseService();
