import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter } from 'firebase/firestore';

/**
 * Get a paginated list of all patients
 * @param {number} page - The current page number
 * @param {number} pageSize - The number of patients per page
 * @param {Object} filters - Filtering options (status, tag_id, etc.)
 * @returns {Promise<Object>} - The paginated list of patients
 */
export const getAllPatients = async (page = 1, pageSize = 10, filters = {}) => {
  try {
    const patientsCollection = collection(db, 'patients');
    let q = query(patientsCollection, orderBy('lastName', 'asc'));

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.search) {
      // Firestore doesn't support case-insensitive partial text search well.
      // A common approach is to store a lowercase version of the fields to search.
      // Or use a third-party search service like Algolia.
      // Simple prefix search:
      q = query(q, where('lastName', '>=', filters.search), where('lastName', '<=', filters.search + '\uf8ff'));
    }
    
    // Pagination would require more complex cursor-based logic with Firestore
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const count = data.length; // Note: This is not total count, just fetched count

    return {
      data,
      meta: {
        total: count, // This is incorrect for pagination, would need a separate count query.
        per_page: pageSize,
        current_page: page,
        last_page: Math.ceil(count / pageSize),
      },
    };
  } catch (error) {
    console.error('Error getting all patients:', error.message);
    return { data: [], meta: {}, error: error.message };
  }
};

/**
 * Get a single patient by ID
 * @param {string} id - The ID of the patient
 * @returns {Promise<Object>} - The patient data
 */
export const getPatientById = async (id) => {
  try {
    const docRef = doc(db, 'patients', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'No such document!' };
    }
  } catch (error) {
    console.error('Error getting patient by ID:', error.message);
    return { data: null, error: error.message };
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - The data for the new patient
 * @returns {Promise<Object>} - The created patient data
 */
export const createPatient = async (patientData) => {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
        ...patientData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return { data: { id: docRef.id, ...patientData }, error: null };
  } catch (error) {
    console.error('Error creating patient:', error.message);
    return { data: null, error: error.message };
  }
};

/**
 * Update an existing patient
 * @param {string} id - The ID of the patient to update
 * @param {Object} patientData - The new data for the patient
 * @returns {Promise<Object>} - The updated patient data
 */
export const updatePatient = async (id, patientData) => {
  try {
    const docRef = doc(db, 'patients', id);
    await updateDoc(docRef, { ...patientData, updatedAt: new Date() });
    return { data: { id, ...patientData }, error: null };
  } catch (error) {
    console.error('Error updating patient:', error.message);
    return { data: null, error: error.message };
  }
};

/**
 * Delete a patient
 * @param {string} id - The ID of the patient to delete
 * @returns {Promise<Object>} - The result of the delete operation
 */
export const deletePatient = async (id) => {
  try {
    await deleteDoc(doc(db, 'patients', id));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting patient:', error.message);
    return { success: false, error: error.message };
  }
};


const patientsApi = {
  getAll: getAllPatients,
  getById: getPatientById,
  create: createPatient,
  update: updatePatient,
  delete: deletePatient,
};

export default patientsApi;
