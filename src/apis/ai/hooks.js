
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchPrompts,
  fetchPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  fetchAISettings,
  updateAISettings,
  fetchAILogs,
} from './api';

// Query keys
const queryKeys = {
  prompts: {
    all: ['ai', 'prompts'],
    detail: (id) => [...queryKeys.prompts.all, id],
  },
  settings: () => ['ai', 'settings'],
  logs: (options) => ['ai', 'logs', options],
};

// Prompts hooks
export const useAIPrompts = () => {
  return useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: fetchPrompts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAIPrompt = (promptId) => {
  return useQuery({
    queryKey: queryKeys.prompts.detail(promptId),
    queryFn: () => fetchPrompt(promptId),
    enabled: !!promptId,
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      toast.success('Prompt created successfully');
    },
    onError: (error) => {
      console.error('Error creating prompt:', error);
      toast.error(`Failed to create prompt: ${error.message}`);
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.setQueryData(queryKeys.prompts.detail(data.id), data);
      toast.success('Prompt updated successfully');
    },
    onError: (error) => {
      console.error('Error updating prompt:', error);
      toast.error(`Failed to update prompt: ${error.message}`);
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.removeQueries({
        queryKey: queryKeys.prompts.detail(variables),
      });
      toast.success('Prompt deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting prompt:', error);
      toast.error(`Failed to delete prompt: ${error.message}`);
    },
  });
};

// Settings hooks
export const useAISettings = () => {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: fetchAISettings,
  });
};

export const useUpdateAISettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAISettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
      toast.success('AI settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating AI settings:', error);
      toast.error(`Failed to update AI settings: ${error.message}`);
    },
  });
};

// Logs hooks
export const useAILogs = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.logs(options),
    queryFn: () => fetchAILogs(options),
  });
};

    