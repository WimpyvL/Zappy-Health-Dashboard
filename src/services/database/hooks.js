/**
 * @fileoverview Centralized React Query hooks for database operations.
 * This file uses the centralized `dbService` to provide hooks for components.
 * This pattern keeps data-fetching logic separate from UI components and
 * ensures a consistent, maintainable way to interact with the database.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from './index';

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
export const useCreatePatient = (options) => useCreateEntity('patients', options);
export const useUpdatePatient = (options) => useUpdateEntity('patients', options);


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
