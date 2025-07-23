import { dbService } from '@/services/database';
import { Patient } from '@/types/patient'; // Assuming a types.ts file exists for the Patient interface

interface PatientFilters {
  status?: string;
  search?: string;
}

const getAllPatients = async (page = 1, pageSize = 10, filters: PatientFilters = {}) => {
  const dbFilters = [];
  if (filters.status) {
    dbFilters.push({ field: 'status', op: '==', value: filters.status });
  }
  if (filters.search) {
    // Note: Firestore does not support full-text search natively.
    // This is a simple prefix search and may not be sufficient for production.
    dbFilters.push({ field: 'lastName', op: '>=', value: filters.search });
    dbFilters.push({ field: 'lastName', op: '<=', value: filters.search + '\uf8ff' });
  }

  return await dbService.getAll<Patient>('patients', {
    filters: dbFilters,
    sortBy: 'lastName',
    sortDirection: 'asc',
    pageSize: pageSize,
  });
};

const getPatientById = async (id: string) => {
  return await dbService.getById<Patient>('patients', id);
};

const createPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
  return await dbService.create('patients', patientData);
};

const updatePatient = async (id: string, patientData: Partial<Patient>) => {
  return await dbService.update('patients', id, patientData);
};

const deletePatient = async (id: string) => {
  return await dbService.delete('patients', id);
};

const patientsApi = {
  getAll: getAllPatients,
  getById: getPatientById,
  create: createPatient,
  update: updatePatient,
  delete: deletePatient,
};

export default patientsApi;