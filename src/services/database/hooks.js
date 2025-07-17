/**
 * @fileoverview Centralized React Query hooks for database operations.
 * This file uses the centralized `dbService` to provide hooks for components.
 * This pattern keeps data-fetching logic separate from UI components and
 * ensures a consistent, maintainable way to interact with the database.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from './index';
import { useToast } from '@/hooks/use-toast';
import auditLogService from './auditLogService';

// --- Query Keys Factory ---
// A centralized place for managing query keys. This is crucial for
// effective caching and cache invalidation with React Query.
export const queryKeys = {
  all: ['allEntities'],
  lists: (entity, filters = {}) => [entity, 'list', filters],
  details: (entity, id) => [entity, 'detail', id],
  // Add other specific key structures as needed
};

// --- Generic Hooks (can be used for any entity) ---

/**
 * A generic hook to fetch a list of documents from any collection.
 * @param {string} entityName - The name of the collection (e.g., 'patients').
 * @param {object} [options] - React Query options.
 * @returns {QueryResult}
 */
export const useEntities = (entityName, options = {}) => {
  return useQuery({
    queryKey: queryKeys.lists(entityName, options.filters),
    queryFn: () => dbService[entityName].getAll(options.filters),
    ...options,
  });
};

/**
 * A generic hook to create a new document in any collection.
 * @param {string} entityName - The name of the collection.
 * @param {object} [options] - React Query mutation options.
 * @returns {MutationResult}
 */
export const useCreateEntity = (entityName, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => dbService[entityName].create(data),
    onSuccess: () => {
      // Invalidate the list query to refetch data after a creation.
      queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });
    },
    ...options,
  });
};

/**
 * A generic hook to update a document in any collection.
 * @param {string} entityName - The name of the collection.
 * @param {object} [options] - React Query mutation options.
 * @returns {MutationResult}
 */
export const useUpdateEntity = (entityName, options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...data }) => dbService[entityName].update(id, data),
      onSuccess: (data, variables) => {
        // Invalidate both the list and the specific detail query.
        queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });
        queryClient.invalidateQueries({ queryKey: [entityName, 'detail', variables.id] });
      },
      ...options,
    });
};


// --- Patients Hooks ---

export const usePatients = (options) => useEntities('patients', options);
export const usePatientById = (id, options) => {
  return useQuery({
    queryKey: queryKeys.details('patients', id),
    queryFn: () => dbService.patients.getById(id),
    enabled: !!id,
    ...options,
  });
};
export const useCreatePatient = (options = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patientData) => {
      const { data, error } = await dbService.patients.create(patientData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast({
        title: 'Patient Created',
        description: `${variables.firstName} ${variables.lastName} has been added.`,
      });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast({
        variant: "destructive",
        title: 'Error Creating Patient',
        description: error.message || 'An unknown error occurred.',
      });
      options.onError?.(error, variables, context);
    },
    ...options,
  });
};
export const useUpdatePatient = (options = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...patientData }) => {
      const { data, error } = await dbService.patients.update(id, patientData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.details(variables.id) });
      toast({
        title: 'Patient Updated',
        description: `Information for ${variables.firstName} ${variables.lastName} has been updated.`,
      });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast({
        variant: "destructive",
        title: 'Error Updating Patient',
        description: error.message || 'An unknown error occurred.',
      });
      options.onError?.(error, variables, context);
    },
    ...options,
  });
};


// --- Providers Hooks ---

export const useProviders = (options) => useEntities('providers', options);
export const useProviderById = (id, options) => {
  return useQuery({
    queryKey: queryKeys.details('providers', id),
    queryFn: () => dbService.providers.getById(id),
    enabled: !!id,
    ...options,
  });
};
export const useCreateProvider = (options) => useCreateEntity('providers', options);
export const useUpdateProvider = (options) => useUpdateEntity('providers', options);

// --- Sessions Hooks ---
export const useSessions = (params = {}, pageSize = 10) => {
    const { page, status, patientId, searchTerm } = params;
    const currentPage = page || 1;
  
    return useQuery({
      queryKey: queryKeys.lists('sessions', params),
      queryFn: async () => {
        const result = await dbService.sessions.getAll({
            page: currentPage,
            pageSize,
            filters: { status, patientId, searchTerm }
        });
        if (result.error) {
            throw new Error(result.error.message);
        }
        return result;
      },
      keepPreviousData: true,
    });
  };

export const useUpdateSessionStatus = (options = {}) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
      mutationFn: async ({ sessionId, status }) => {
        if (!sessionId) throw new Error('Session ID is required for status update.');
        const result = await dbService.sessions.update(sessionId, { status });
        if(result.error) throw result.error;
        return result.data;
      },
      onSuccess: (data, variables) => {
        toast({
            title: "Session Updated",
            description: `Session status successfully changed.`,
        });
        queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', variables.sessionId] });
        if (options.onSuccess) options.onSuccess(data, variables);
      },
      onError: (error, variables) => {
        toast({
            variant: "destructive",
            title: "Error Updating Status",
            description: error.message,
        });
        if (options.onError) options.onError(error, variables);
      },
    });
};
// ============================================================================
// CONSULTATION HOOKS
// ============================================================================

/**
 * Hook to fetch consultations with pagination and filtering
 * @param {Object} options - Query options with page, pageSize, filters
 * @returns {Object} Query result with consultations data
 */
export const useConsultations = (options = {}) => {
  const { page = 1, pageSize = 20, filters = {}, ...queryOptions } = options;
  const { toast } = useToast();

  return useQuery({
    queryKey: ['consultations', 'list', { page, pageSize, filters }],
    queryFn: async () => {
      const result = await dbService.consultations.getAll({
        page,
        pageSize,
        filters,
      });
      if (result.error) throw result.error;
      return result.data || result;
    },
    keepPreviousData: true,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error) => {
      console.error('Fetch consultations error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to fetch consultations'
      });
    },
    ...queryOptions,
  });
};

/**
 * Hook to fetch patient orders
 * @param {string} patientId - Patient ID
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with patient orders
 */
export const usePatientOrders = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['orders', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await dbService.orders.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch patient appointments
 * @param {string} patientId - Patient ID
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with patient appointments
 */
export const usePatientAppointments = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      console.warn(
        'usePatientAppointments: Using sessions as a stand-in for appointments.'
      );
      const result = await dbService.sessions.getAll({ filters: [{ field: 'patient_id', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch patient payments
 * @param {string} patientId - Patient ID
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with patient payments
 */
export const usePatientPayments = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['payments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await dbService.payments.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch patient alerts
 * @param {string} patientId - Patient ID
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with patient alerts
 */
export const usePatientAlerts = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['alerts', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];

       const result = await dbService.alerts.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
       if (result.error) throw result.error;
       return result;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
