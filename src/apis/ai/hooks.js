import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchPrompts,
  fetchPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  testPrompt,
  fetchAISettings,
  updateAISettings,
  fetchAILogs,
  fetchAIMetrics,
} from './api';

// Query keys
const queryKeys = {
  prompts: {
    all: ['ai', 'prompts'],
    detail: (id) => [...queryKeys.prompts.all, id],
    byCategory: (category) => [...queryKeys.prompts.all, 'category', category],
    byType: (type) => [...queryKeys.prompts.all, 'type', type],
    bySection: (section) => [...queryKeys.prompts.all, 'section', section],
    byCategoryAndType: (category, type) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'type',
      type,
    ],
    byCategoryAndSection: (category, section) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'section',
      section,
    ],
    byTypeAndSection: (type, section) => [
      ...queryKeys.prompts.all,
      'type',
      type,
      'section',
      section,
    ],
    byCategoryTypeAndSection: (category, type, section) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'type',
      type,
      'section',
      section,
    ],
  },
  settings: () => ['ai', 'settings'],
  logs: (options) => ['ai', 'logs', options],
  metrics: () => ['ai', 'metrics'],
};

// Prompts hooks
export const useAIPrompts = () => {
  return useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: fetchPrompts,
    initialData: [], // Add default empty array to prevent undefined data
  });
};

export const useAIPrompt = (promptId) => {
  return useQuery({
    queryKey: queryKeys.prompts.detail(promptId),
    queryFn: () => fetchPrompt(promptId),
    enabled: !!promptId,
  });
};

export const useAIPromptsByCategory = (category) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategory(category),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter(
          (prompt) => prompt.category === category
        );

        // If no prompts found for category, provide helpful fallback
        if (filtered.length === 0) {
          console.warn(`No prompts found for category: ${category}`);
          // Return a basic prompt for the category if available
          const { fallbackProvider } = await import(
            '../../utils/errorHandling'
          );
          return fallbackProvider.getFallback(`ai_prompts_${category}`, []);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by category:', error);
        const { fallbackProvider } = await import('../../utils/errorHandling');
        return fallbackProvider.getFallback(`ai_prompts_${category}`, []);
      }
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsByType = (type) => {
  return useQuery({
    queryKey: queryKeys.prompts.byType(type),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter(
          (prompt) => prompt.prompt_type === type
        );

        if (filtered.length === 0) {
          console.warn(`No prompts found for type: ${type}`);
          const { fallbackProvider } = await import(
            '../../utils/errorHandling'
          );
          return fallbackProvider.getFallback(`ai_prompts_${type}`, []);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by type:', error);
        const { fallbackProvider } = await import('../../utils/errorHandling');
        return fallbackProvider.getFallback(`ai_prompts_${type}`, []);
      }
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsBySection = (section) => {
  return useQuery({
    queryKey: queryKeys.prompts.bySection(section),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter((prompt) => prompt.section === section);

        if (filtered.length === 0) {
          console.warn(`No prompts found for section: ${section}`);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by section:', error);
        return []; // Return empty array as fallback for sections
      }
    },
    enabled: !!section,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsByCategoryAndType = (category, type) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryAndType(category, type),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.category === category && prompt.prompt_type === type
      );
    },
    enabled: !!(category && type),
  });
};

export const useAIPromptsByCategoryAndSection = (category, section) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryAndSection(category, section),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.category === category && prompt.section === section
      );
    },
    enabled: !!(category && section),
  });
};

export const useAIPromptsByTypeAndSection = (type, section) => {
  return useQuery({
    queryKey: queryKeys.prompts.byTypeAndSection(type, section),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.prompt_type === type && prompt.section === section
      );
    },
    enabled: !!(type && section),
  });
};

export const useAIPromptsByCategoryTypeAndSection = (
  category,
  type,
  section
) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryTypeAndSection(
      category,
      type,
      section
    ),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) =>
          prompt.category === category &&
          prompt.prompt_type === type &&
          prompt.section === section
      );
    },
    enabled: !!(category && type && section),
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.detail(data.id),
      });
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

export const useTestPrompt = () => {
  return useMutation({
    mutationFn: testPrompt,
    onSuccess: () => {
      toast.success('Prompt tested successfully');
    },
    onError: (error) => {
      console.error('Error testing prompt:', error);
      toast.error(`Failed to test prompt: ${error.message}`);
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

// Metrics hooks
export const useAIMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metrics(),
    queryFn: fetchAIMetrics,
  });
};
