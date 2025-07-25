/**
 * @fileoverview AI Management React Query hooks with TypeScript support
 * Provides type-safe hooks for AI prompts, settings, and logs management
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
// Note: These imports will need to be implemented in the api file
// For now, we'll create placeholder functions to avoid import errors
const fetchPrompts = async (): Promise<any[]> => { throw new Error('Not implemented'); };
const fetchPrompt = async (id: string): Promise<any> => { throw new Error('Not implemented'); };
const createPrompt = async (data: any): Promise<any> => { throw new Error('Not implemented'); };
const updatePrompt = async (data: any): Promise<any> => { throw new Error('Not implemented'); };
const deletePrompt = async (id: string): Promise<void> => { throw new Error('Not implemented'); };
const fetchAISettings = async (): Promise<any> => { throw new Error('Not implemented'); };
const updateAISettings = async (data: any): Promise<any> => { throw new Error('Not implemented'); };
const fetchAILogs = async (options: any): Promise<any> => { throw new Error('Not implemented'); };

// Type definitions for AI management
interface AIPrompt {
  id: string;
  name: string;
  description?: string;
  template: string;
  category: string;
  variables?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version?: number;
  tags?: string[];
}

interface CreatePromptData {
  name: string;
  description?: string;
  template: string;
  category: string;
  variables?: string[];
  isActive?: boolean;
  tags?: string[];
}

interface UpdatePromptData extends Partial<CreatePromptData> {
  id: string;
}

interface AISettings {
  id: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  apiKey?: string;
  endpoint?: string;
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  enableCaching: boolean;
  cacheExpiry: number;
  rateLimitPerMinute: number;
  updatedAt: string;
  updatedBy: string;
}

interface UpdateAISettingsData extends Partial<Omit<AISettings, 'id' | 'updatedAt' | 'updatedBy'>> {}

interface AILogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  promptId?: string;
  userId: string;
  model: string;
  tokensUsed?: number;
  responseTime?: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface AILogsOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: 'request' | 'response' | 'error';
  status?: 'success' | 'error' | 'timeout';
  userId?: string;
  promptId?: string;
}

interface AILogsResponse {
  logs: AILogEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface QueryKeys {
  prompts: {
    all: string[];
    detail: (id: string) => string[];
  };
  settings: () => string[];
  logs: (options: AILogsOptions) => string[];
}

// Query keys with proper typing
const queryKeys: QueryKeys = {
  prompts: {
    all: ['ai', 'prompts'],
    detail: (id: string) => [...queryKeys.prompts.all, id],
  },
  settings: () => ['ai', 'settings'],
  logs: (options: AILogsOptions) => ['ai', 'logs', JSON.stringify(options)],
};

// Prompts hooks with TypeScript support
/**
 * Hook to fetch all AI prompts
 * @param options - Additional query options
 * @returns Query result with typed prompts data
 */
export const useAIPrompts = (options?: {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}): UseQueryResult<AIPrompt[], Error> => {
  const { enabled = true, staleTime = 5 * 60 * 1000, refetchOnWindowFocus = false } = options || {};

  return useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: fetchPrompts,
    enabled,
    staleTime,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch a specific AI prompt
 * @param promptId - The prompt ID to fetch
 * @param options - Additional query options
 * @returns Query result with typed prompt data
 */
export const useAIPrompt = (
  promptId: string | null | undefined,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<AIPrompt | null, Error> => {
  const { enabled = true, staleTime = 10 * 60 * 1000 } = options || {};

  return useQuery({
    queryKey: queryKeys.prompts.detail(promptId || ''),
    queryFn: async (): Promise<AIPrompt | null> => {
      if (!promptId) {
        throw new Error('Prompt ID is required');
      }
      return await fetchPrompt(promptId);
    },
    enabled: !!promptId && enabled,
    staleTime,
    retry: (failureCount, error) => {
      // Don't retry if prompt doesn't exist
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to create a new AI prompt
 * @returns Mutation result for prompt creation
 */
export const useCreatePrompt = (): UseMutationResult<
  AIPrompt,
  Error,
  CreatePromptData,
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePromptData): Promise<AIPrompt> => {
      // Validate required fields
      if (!data.name || !data.template || !data.category) {
        throw new Error('Name, template, and category are required');
      }

      return await createPrompt(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      toast({
        title: "✅ Prompt created successfully",
        description: `Created prompt: ${data.name}`,
      });

      // Log successful creation
      console.log('AI prompt created:', {
        id: data.id,
        name: data.name,
        category: data.category,
        createdAt: data.createdAt,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error creating prompt:', error);
      
      toast({
        title: "Create AI Prompt",
        description: `Failed to create prompt: ${errorMessage}`,
        variant: "destructive"
      });
    },
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Don't retry validation errors
      if (errorMessage.includes('required') || errorMessage.includes('invalid')) {
        return false;
      }
      
      return failureCount < 1;
    },
  });
};

/**
 * Hook to update an existing AI prompt
 * @returns Mutation result for prompt update
 */
export const useUpdatePrompt = (): UseMutationResult<
  AIPrompt,
  Error,
  UpdatePromptData,
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdatePromptData): Promise<AIPrompt> => {
      if (!data.id) {
        throw new Error('Prompt ID is required for update');
      }

      return await updatePrompt(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.setQueryData(queryKeys.prompts.detail(data.id), data);
      
      toast({
        title: "✅ Prompt updated successfully",
        description: `Updated prompt: ${data.name}`,
      });

      // Log successful update
      console.log('AI prompt updated:', {
        id: data.id,
        name: data.name,
        updatedAt: data.updatedAt,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating prompt:', error);
      
      toast({
        title: "Update AI Prompt",
        description: `Failed to update prompt: ${errorMessage}`,
        variant: "destructive"
      });
    },
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Don't retry validation or not found errors
      if (errorMessage.includes('required') || errorMessage.includes('not found')) {
        return false;
      }
      
      return failureCount < 1;
    },
  });
};

/**
 * Hook to delete an AI prompt
 * @returns Mutation result for prompt deletion
 */
export const useDeletePrompt = (): UseMutationResult<
  void,
  Error,
  string,
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promptId: string): Promise<void> => {
      if (!promptId) {
        throw new Error('Prompt ID is required for deletion');
      }

      return await deletePrompt(promptId);
    },
    onSuccess: (_, promptId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.removeQueries({
        queryKey: queryKeys.prompts.detail(promptId),
      });
      
      toast({
        title: "✅ Prompt deleted successfully",
        description: "The prompt has been permanently removed",
      });

      // Log successful deletion
      console.log('AI prompt deleted:', {
        id: promptId,
        deletedAt: new Date().toISOString(),
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error deleting prompt:', error);
      
      toast({
        title: "Delete AI Prompt",
        description: `Failed to delete prompt: ${errorMessage}`,
        variant: "destructive"
      });
    },
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Don't retry if prompt doesn't exist
      if (errorMessage.includes('not found')) {
        return false;
      }
      
      return failureCount < 1;
    },
  });
};

// Settings hooks with TypeScript support
/**
 * Hook to fetch AI settings
 * @param options - Additional query options
 * @returns Query result with typed settings data
 */
export const useAISettings = (options?: {
  enabled?: boolean;
  staleTime?: number;
}): UseQueryResult<AISettings | null, Error> => {
  const { enabled = true, staleTime = 10 * 60 * 1000 } = options || {};

  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: fetchAISettings,
    enabled,
    staleTime,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to update AI settings
 * @returns Mutation result for settings update
 */
export const useUpdateAISettings = (): UseMutationResult<
  AISettings,
  Error,
  UpdateAISettingsData,
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateAISettingsData): Promise<AISettings> => {
      // Validate settings data
      if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 2)) {
        throw new Error('Temperature must be between 0 and 2');
      }
      
      if (data.maxTokens !== undefined && data.maxTokens < 1) {
        throw new Error('Max tokens must be greater than 0');
      }

      if (data.topP !== undefined && (data.topP < 0 || data.topP > 1)) {
        throw new Error('Top P must be between 0 and 1');
      }

      return await updateAISettings(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
      
      toast({
        title: "✅ AI settings updated successfully",
        description: "Your AI configuration has been saved",
      });

      // Log successful update
      console.log('AI settings updated:', {
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        updatedAt: data.updatedAt,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating AI settings:', error);
      
      toast({
        title: "Update AI Settings",
        description: `Failed to update AI settings: ${errorMessage}`,
        variant: "destructive"
      });
    },
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Don't retry validation errors
      if (errorMessage.includes('must be') || errorMessage.includes('invalid')) {
        return false;
      }
      
      return failureCount < 1;
    },
  });
};

// Logs hooks with TypeScript support
/**
 * Hook to fetch AI logs with filtering options
 * @param options - Filtering and pagination options
 * @returns Query result with typed logs data
 */
export const useAILogs = (
  options: AILogsOptions = {},
  queryOptions?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
): UseQueryResult<AILogsResponse, Error> => {
  const { enabled = true, staleTime = 2 * 60 * 1000, refetchInterval } = queryOptions || {};

  const queryConfig: any = {
    queryKey: queryKeys.logs(options),
    queryFn: async (): Promise<AILogsResponse> => {
      return await fetchAILogs(options);
    },
    enabled,
    staleTime,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on authentication errors
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  };

  if (refetchInterval !== undefined) {
    queryConfig.refetchInterval = refetchInterval;
  }

  return useQuery(queryConfig) as UseQueryResult<AILogsResponse, Error>;
};

/**
 * Hook to get AI usage statistics from logs
 * @param options - Filtering options for statistics
 * @returns Query result with usage statistics
 */
export const useAIUsageStats = (
  options: Pick<AILogsOptions, 'startDate' | 'endDate' | 'userId'> = {}
): UseQueryResult<{
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  successRate: number;
  topPrompts: Array<{ promptId: string; count: number; }>;
} | undefined, Error> => {
  const { data: logsData, ...queryResult } = useAILogs(options);

  return {
    ...queryResult,
    data: logsData ? {
      totalRequests: logsData.total,
      totalTokens: logsData.logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0),
      averageResponseTime: logsData.logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / logsData.logs.length || 0,
      successRate: logsData.logs.filter(log => log.status === 'success').length / logsData.logs.length * 100 || 0,
      topPrompts: Object.entries(
        logsData.logs.reduce((acc, log) => {
          if (log.promptId) {
            acc[log.promptId] = (acc[log.promptId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      )
      .map(([promptId, count]) => ({ promptId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    } : undefined,
  } as any;
};

// Export types for use in other parts of the application
export type {
  AIPrompt,
  CreatePromptData,
  UpdatePromptData,
  AISettings,
  UpdateAISettingsData,
  AILogEntry,
  AILogsOptions,
  AILogsResponse,
  QueryKeys,
};
