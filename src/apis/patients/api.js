
import { supabase } from '../../lib/supabase';

/**
 * Get a paginated list of all patients
 * @param {number} page - The current page number
 * @param {number} pageSize - The number of patients per page
 * @param {Object} filters - Filtering options (status, tag_id, etc.)
 * @returns {Promise<Object>} - The paginated list of patients
 */
export const getAllPatients = async (page = 1, pageSize = 10, filters = {}) => {
  try {
    let query = supabase.from('patients').select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }
    // Note: Tag filtering would require a join, which is more complex here.
    // It's often better handled via a dedicated RPC function or post-processing.

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      meta: {
        total: count,
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
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
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
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
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
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
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
    const { data, error } = await supabase.from('patients').delete().eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting patient:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get a patient's health history
 * @param {string} patientId - The ID of the patient
 * @returns {Promise<Object>} - The patient's health history
 */
export const getPatientHistory = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('health_history')
      .eq('id', patientId)
      .single();

    if (error) throw error;

    return { success: true, history: data?.health_history || '' };
  } catch (error) {
    console.error('Error getting patient history:', error.message);
    return { success: false, error: error.message, history: '' };
  }
};

/**
 * Update a patient's health history
 * @param {string} patientId - The ID of the patient
 * @param {string} history - The health history text
 * @returns {Promise<Object>} - The result of the update operation
 */
export const updatePatientHistory = async (patientId, history) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ health_history: history })
      .eq('id', patientId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating patient history:', error.message);
    return { success: false, error: error.message };
  }
};


const patientsApi = {
  getAll: getAllPatients,
  getById: getPatientById,
  create: createPatient,
  update: updatePatient,
  delete: deletePatient,
  getHistory: getPatientHistory,
  updateHistory: updatePatientHistory,
};

export default patientsApi;
