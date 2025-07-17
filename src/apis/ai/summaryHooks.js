
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateIntakeSummary,
  generateAssessment,
  generatePlan,
  saveSummary,
  getSummary,
} from './summaryService';
import { toast } from 'react-toastify';
import { ErrorHandler } from '../../utils/errorHandling';

const errorHandler = new ErrorHandler('AI Summary');

// Query keys for AI summaries
export const summaryQueryKeys = {
  all: ['ai-summaries'],
  summary: (patientId, formId) => [
    ...summaryQueryKeys.all,
    'summary',
    patientId,
    formId,
  ],
  assessment: (patientId, formId) => [
    ...summaryQueryKeys.all,
    'assessment',
    patientId,
    formId,
  ],
  plan: (patientId, formId) => [
    ...summaryQueryKeys.all,
    'plan',
    patientId,
    formId,
  ],
};

/**
 * Hook to fetch an AI summary
 * @param {string} consultationId - The consultation ID
 * @returns {Object} Query result
 */
export const useAISummary = (consultationId) => {
  return useQuery({
    queryKey: summaryQueryKeys.summary(consultationId),
    queryFn: () => getSummary(consultationId),
    enabled: !!consultationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};


/**
 * Hook to generate and save an AI summary in one operation
 * Combines the generation and saving steps with proper error handling
 * @returns {Object} The mutation result
 */
export const useGenerateAndSaveAISummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consultationId,
      formData,
      categoryId,
      promptType = 'initial',
    }) => {
      try {
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
        };
      } catch (error) {
        // Enhanced error handling for combined operation
        if (error.message?.includes('rate limit')) {
          throw new Error(
            'AI service is temporarily busy. Please wait a moment and try again.'
          );
        } else if (error.message?.includes('network')) {
          throw new Error(
            'Connection issue detected. Please check your internet connection and try again.'
          );
        } else if (error.message?.includes('authentication')) {
          throw new Error(
            'AI service authentication failed. Please refresh the page and try again.'
          );
        } else if (error.message?.includes('permission')) {
          throw new Error("You don't have permission to save AI summaries.");
        } else {
          throw new Error(
            'Failed to generate and save AI summary. Please try again or contact support if the issue persists.'
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      toast.success('✅ AI summary generated and saved successfully');

      // Log successful generation and save for analytics
      console.log('AI summary generated and saved:', {
        consultationId: variables.consultationId,
        categoryId: variables.categoryId,
        promptType: variables.promptType,
        summaryLength: data.summary?.length || 0,
        savedAt: data.savedAt,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: summaryQueryKeys.summary(
          variables.consultationId,
        ),
      });
    },
    onError: (error, variables) => {
      errorHandler.handleError(error, 'Generate and Save AI Summary', {
        toastId: 'ai-generate-save-error',
      });

      // Provide actionable feedback to user
      const canRetry =
        !error.message?.includes('authentication') &&
        !error.message?.includes('permission');
      if (canRetry) {
        console.log('AI summary generation and save failed - user can retry');
      }
    },
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (
        error.message?.includes('permission') ||
        error.message?.includes('authentication')
      ) {
        return false;
      }
      // Retry logic based on error type
      if (error.message?.includes('rate limit')) {
        return failureCount < 1; // Only retry once for rate limits
      } else if (error.message?.includes('network')) {
        return failureCount < 2; // Retry twice for network issues
      }
      return failureCount < 1; // Retry once for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
