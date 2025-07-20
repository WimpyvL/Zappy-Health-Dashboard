/**
 * @fileoverview Centralized React Query hooks for database operations.
 * This file uses the centralized `dbService` to provide hooks for components.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from './index';
import { useToast } from '@/hooks/use-toast';
import auditLogService from './auditLogService';

// --- Query Keys Factory ---
export const queryKeys = {
  all: ['allEntities'],
  lists: (entity, filters = {}) => [entity, 'list', filters],
  details: (entity, id) => [entity, 'detail', id],
};

// --- Generic Hooks ---
export const useEntities = (entityName, options = {}) => {
  return useQuery({
    queryKey: queryKeys.lists(entityName, options.filters),
    queryFn: () => dbService[entityName].getAll(options.filters),
    ...options,
  });
};

export const useCreateEntity = (entityName, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => dbService[entityName].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });
    },
    ...options,
  });
};

export const useUpdateEntity = (entityName, options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...data }) => dbService[entityName].update(id, data),
      onSuccess: (data, variables) => {
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
export const useCreatePatient = (options) => useCreateEntity('patients', options);
export const useUpdatePatient = (options) => useUpdateEntity('patients', options);
export const useAddPatientTag = () => {}; // Placeholder
export const useRemovePatientTag = () => {}; // Placeholder

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
        toast({title: "Session status successfully changed."});
        queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', variables.sessionId] });
        if (options.onSuccess) options.onSuccess(data, variables);
      },
      onError: (error, variables) => {
        toast({variant: "destructive", title: `Error updating status: ${error.message}`});
        if (options.onError) options.onError(error, variables);
      },
    });
};

// --- Consultation Hooks ---
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
    staleTime: 30 * 1000,
    onError: (error) => {
      console.error('Fetch consultations error:', error);
      toast({variant: "destructive", title: error.message || 'Failed to fetch consultations'});
    },
    ...queryOptions,
  });
};

export const usePatientOrders = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['orders', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await dbService.orders.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePatientAppointments = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      console.warn('usePatientAppointments: Using sessions as a stand-in for appointments.');
      const result = await dbService.sessions.getAll({ filters: [{ field: 'patient_id', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePatientPayments = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['payments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await dbService.payments.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePatientAlerts = (patientId, options = {}) => {
  return useQuery({
    queryKey: ['alerts', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
       const result = await dbService.alerts.getAll({ filters: [{ field: 'patientId', op: '==', value: patientId }] });
       if (result.error) throw result.error;
       return result.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
