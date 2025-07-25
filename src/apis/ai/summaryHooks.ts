/**
 * @fileoverview AI Summary React Query hooks with TypeScript support
 * Provides type-safe hooks for AI summary generation, fetching, and management
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
// Note: These imports will need to be implemented in the summaryService file
// For now, we'll create placeholder functions to avoid import errors
const generateIntakeSummary = async (formData: any, categoryId: any, promptType?: any): Promise<any> => { throw new Error('Not implemented'); };
const generateAssessment = async (formData: any, categoryId: any): Promise<any> => { throw new Error('Not implemented'); };
const generatePlan = async (formData: any, categoryId: any): Promise<any> => { throw new Error('Not implemented'); };
const saveSummary = async (consultationId: any, summaryData: any, type?: any): Promise<any> => { throw new Error('Not implemented'); };
const getSummary = async (id: string): Promise<any> => { throw new Error('Not implemented'); };
import { useToast } from "@/hooks/use-toast";

// Type definitions for AI summaries
interface AISummaryData {
  summary?: string;
  assessment?: string;
  plan?: string;
  confidence?: number;
  generatedAt?: string;
  model?: string;
  tokens?: number;
  recommendations?: Array<{ text: string; confidence: number; }>;
  reasoning?: string;
}

interface SavedAISummary extends AISummaryData {
  id: string;
  consultationId: string;
  saved: boolean;
  savedAt: string;
  type: 'summary' | 'assessment' | 'plan';
  version?: number;
}

interface GenerateAndSaveParams {
  consultationId: string;
  formData: Record<string, any>;
  categoryId: string;
  promptType?: 'initial' | 'follow-up' | 'assessment' | 'plan';
}

interface GenerateAndSaveResult extends AISummaryData {
  saved: boolean;
  savedAt: string;
  consultationId: string;
}

interface SummaryQueryKeys {
  all: string[];
  summary: (patientId?: string, formId?: string) => string[];
  assessment: (patientId?: string, formId?: string) => string[];
  plan: (patientId?: string, formId?: string) => string[];
}

// Query keys for AI summaries with proper typing
export const summaryQueryKeys: SummaryQueryKeys = {
  all: ['ai-summaries'],
  summary: (patientId?: string, formId?: string) => [
    ...summaryQueryKeys.all,
    'summary',
    patientId,
    formId,
  ].filter(Boolean) as string[],
  assessment: (patientId?: string, formId?: string) => [
    ...summaryQueryKeys.all,
    'assessment',
    patientId,
    formId,
  ].filter(Boolean) as string[],
  plan: (patientId?: string, formId?: string) => [
    ...summaryQueryKeys.all,
    'plan',
    patientId,
    formId,
  ].filter(Boolean) as string[],
};

/**
 * Hook to fetch an AI summary with type safety
 * @param consultationId - The consultation ID
 * @param options - Additional query options
 * @returns Query result with typed data
 */
export const useAISummary = (
  consultationId: string | null | undefined,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  }
): UseQueryResult<SavedAISummary | null, Error> => {
  const { enabled = true, staleTime = 10 * 60 * 1000, refetchOnWindowFocus = false } = options || {};

  return useQuery({
    queryKey: summaryQueryKeys.summary(consultationId || undefined),
    queryFn: async (): Promise<SavedAISummary | null> => {
      if (!consultationId) {
        throw new Error('Consultation ID is required');
      }
      return await getSummary(consultationId);
    },
    enabled: !!consultationId && enabled,
    staleTime,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Don't retry if consultation ID is invalid
      if (error.message?.includes('Consultation ID')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch multiple AI summaries for a patient
 * @param patientId - The patient ID
 * @param options - Additional query options
 * @returns Query result with array of summaries
 */
export const usePatientAISummaries = (
  patientId: string | null | undefined,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<SavedAISummary[], Error> => {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options || {};

  return useQuery({
    queryKey: [...summaryQueryKeys.all, 'patient', patientId],
    queryFn: async (): Promise<SavedAISummary[]> => {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }
      // This would need to be implemented in summaryService
      // For now, return empty array
      return [];
    },
    enabled: !!patientId && enabled,
    staleTime,
  });
};

/**
 * Hook to generate and save an AI summary in one operation
 * Combines the generation and saving steps with proper error handling and TypeScript support
 * @returns The mutation result with typed data
 */
export const useGenerateAndSaveAISummary = (): UseMutationResult<
  GenerateAndSaveResult,
  Error,
  GenerateAndSaveParams,
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      consultationId,
      formData,
      categoryId,
      promptType = 'initial',
    }: GenerateAndSaveParams): Promise<GenerateAndSaveResult> => {
      try {
        // Validate input parameters
        if (!consultationId) {
          throw new Error('Consultation ID is required');
        }
        if (!formData || Object.keys(formData).length === 0) {
          throw new Error('Form data is required');
        }
        if (!categoryId) {
          throw new Error('Category ID is required');
        }

        // Step 1: Generate the AI summary
        const generationResult = await generateIntakeSummary(
          formData,
          categoryId,
          promptType
        );

        if (!generationResult || !generationResult.summary) {
          throw new Error('AI service returned an empty response');
        }

        // Step 2: Save the generated summary to database
        const saveResult = await saveSummary(
          consultationId,
          generationResult,
          'summary'
        );

        if (!saveResult) {
          throw new Error('Failed to save AI summary to database');
        }

        // Return the combined result with both generation and save data
        return {
          ...generationResult,
          saved: true,
          savedAt: new Date().toISOString(),
          consultationId,
          generatedAt: new Date().toISOString(),
        };
      } catch (error) {
        // Enhanced error handling for combined operation
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        if (errorMessage.includes('rate limit')) {
          throw new Error(
            'AI service is temporarily busy. Please wait a moment and try again.'
          );
        } else if (errorMessage.includes('network')) {
          throw new Error(
            'Connection issue detected. Please check your internet connection and try again.'
          );
        } else if (errorMessage.includes('authentication')) {
          throw new Error(
            'AI service authentication failed. Please refresh the page and try again.'
          );
        } else if (errorMessage.includes('permission')) {
          throw new Error("You don't have permission to save AI summaries.");
        } else if (errorMessage.includes('required')) {
          throw new Error(errorMessage); // Pass validation errors directly
        } else {
          throw new Error(
            'Failed to generate and save AI summary. Please try again or contact support if the issue persists.'
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: "✅ AI summary generated and saved successfully",
        description: `Summary created for consultation ${variables.consultationId}`,
      });

      // Log successful generation and save for analytics
      console.log('AI summary generated and saved:', {
        consultationId: variables.consultationId,
        categoryId: variables.categoryId,
        promptType: variables.promptType,
        summaryLength: data.summary?.length || 0,
        savedAt: data.savedAt,
        confidence: data.confidence,
        tokens: data.tokens,
      });

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: summaryQueryKeys.summary(variables.consultationId),
      });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Generate and Save AI Summary",
        description: errorMessage,
        variant: "destructive"
      });

      // Log error for debugging
      console.error('AI summary generation failed:', {
        consultationId: variables.consultationId,
        categoryId: variables.categoryId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Provide actionable feedback to user
      const canRetry =
        !errorMessage.includes('authentication') &&
        !errorMessage.includes('permission') &&
        !errorMessage.includes('required');
      
      if (canRetry) {
        console.log('AI summary generation failed - user can retry');
      }
    },
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Don't retry validation, permission, or authentication errors
      if (
        errorMessage.includes('permission') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('required')
      ) {
        return false;
      }
      
      // Retry logic based on error type
      if (errorMessage.includes('rate limit')) {
        return failureCount < 1; // Only retry once for rate limits
      } else if (errorMessage.includes('network')) {
        return failureCount < 2; // Retry twice for network issues
      }
      
      return failureCount < 1; // Retry once for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Hook to generate an AI assessment
 * @returns The mutation result for assessment generation
 */
export const useGenerateAIAssessment = (): UseMutationResult<
  AISummaryData,
  Error,
  Omit<GenerateAndSaveParams, 'promptType'>,
  unknown
> => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ consultationId, formData, categoryId }): Promise<AISummaryData> => {
      if (!consultationId || !formData || !categoryId) {
        throw new Error('Missing required parameters for assessment generation');
      }

      const result = await generateAssessment(formData, categoryId);
      
      if (!result || !result.assessment) {
        throw new Error('Failed to generate AI assessment');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "✅ AI assessment generated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Generate AI Assessment",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });
};

/**
 * Hook to generate an AI treatment plan
 * @returns The mutation result for plan generation
 */
export const useGenerateAIPlan = (): UseMutationResult<
  AISummaryData,
  Error,
  Omit<GenerateAndSaveParams, 'promptType'>,
  unknown
> => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ consultationId, formData, categoryId }): Promise<AISummaryData> => {
      if (!consultationId || !formData || !categoryId) {
        throw new Error('Missing required parameters for plan generation');
      }

      const result = await generatePlan(formData, categoryId);
      
      if (!result || !result.plan) {
        throw new Error('Failed to generate AI treatment plan');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "✅ AI treatment plan generated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Generate AI Treatment Plan",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });
};

/**
 * Hook to save an AI summary to the database
 * @returns The mutation result for saving summaries
 */
export const useSaveAISummary = (): UseMutationResult<
  { success: boolean; id: string; },
  Error,
  {
    consultationId: string;
    summaryData: AISummaryData;
    type: 'summary' | 'assessment' | 'plan';
  },
  unknown
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ consultationId, summaryData, type }) => {
      if (!consultationId || !summaryData) {
        throw new Error('Missing required parameters for saving summary');
      }

      return await saveSummary(consultationId, summaryData, type);
    },
    onSuccess: (_, variables) => {
      toast({
        title: `✅ AI ${variables.type} saved successfully`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: summaryQueryKeys.summary(variables.consultationId),
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Save AI Summary",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });
};

// Export types for use in other parts of the application
export type {
  AISummaryData,
  SavedAISummary,
  GenerateAndSaveParams,
  GenerateAndSaveResult,
  SummaryQueryKeys,
};
