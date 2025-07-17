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
 * @param {string} patientId - The patient ID
 * @param {string} formId - The form ID
 * @returns {Object} Query result
 */
export const useAISummary = (patientId, formId) => {
  return useQuery({
    queryKey: summaryQueryKeys.summary(patientId, formId),
    queryFn: () => getSummary(patientId, formId, 'summary'),
    enabled: !!patientId && !!formId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to generate an AI summary from intake form data with enhanced error handling
 * @returns {Object} The mutation result with comprehensive error management
 */
export const useGenerateAISummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, categoryId, promptType = 'initial' }) => {
      try {
        const result = await generateIntakeSummary(
          formData,
          categoryId,
          promptType
        );

        if (!result || !result.summary) {
          throw new Error('AI service returned an empty response');
        }

        return result;
      } catch (error) {
        // Enhanced error handling with user-friendly messages
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
        } else {
          throw new Error(
            'Failed to generate AI summary. Please try again or contact support if the issue persists.'
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      toast.success('✅ AI summary generated successfully');

      // Log successful generation for analytics
      console.log('AI summary generated:', {
        categoryId: variables.categoryId,
        promptType: variables.promptType,
        summaryLength: data.summary?.length || 0,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
    },
    onError: (error, variables) => {
      errorHandler.handleError(error, 'Generate AI Summary', {
        toastId: 'ai-summary-error',
      });

      // Provide actionable feedback to user
      const canRetry = !error.message?.includes('authentication');
      if (canRetry) {
        console.log('AI summary generation failed - user can retry');
      }
    },
    retry: (failureCount, error) => {
      // Retry logic based on error type
      if (error.message?.includes('rate limit')) {
        return failureCount < 1; // Only retry once for rate limits
      } else if (error.message?.includes('network')) {
        return failureCount < 2; // Retry twice for network issues
      }
      return false; // Don't retry for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Hook to generate an AI assessment from intake form data
 * @returns {Object} The mutation result
 */
export const useGenerateAIAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, categoryId, promptType = 'initial' }) => {
      try {
        const result = await generateAssessment(
          formData,
          categoryId,
          promptType
        );

        if (!result || !result.assessment) {
          throw new Error('AI service returned an empty assessment');
        }

        return result;
      } catch (error) {
        if (error.message?.includes('rate limit')) {
          throw new Error(
            'AI service is temporarily busy. Please wait a moment and try again.'
          );
        } else if (error.message?.includes('network')) {
          throw new Error(
            'Connection issue detected. Please check your internet connection and try again.'
          );
        } else {
          throw new Error(
            'Failed to generate AI assessment. Please try again or contact support if the issue persists.'
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      toast.success('✅ AI assessment generated successfully');
      console.log('AI assessment generated:', {
        categoryId: variables.categoryId,
        promptType: variables.promptType,
        assessmentLength: data.assessment?.length || 0,
      });

      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Generate AI Assessment', {
        toastId: 'ai-assessment-error',
      });
    },
    retry: (failureCount, error) => {
      if (error.message?.includes('rate limit')) {
        return failureCount < 1;
      } else if (error.message?.includes('network')) {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to generate an AI plan from intake form data
 * @returns {Object} The mutation result
 */
export const useGenerateAIPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, categoryId, promptType = 'initial' }) => {
      try {
        const result = await generatePlan(formData, categoryId, promptType);

        if (!result || !result.plan) {
          throw new Error('AI service returned an empty plan');
        }

        return result;
      } catch (error) {
        if (error.message?.includes('rate limit')) {
          throw new Error(
            'AI service is temporarily busy. Please wait a moment and try again.'
          );
        } else if (error.message?.includes('network')) {
          throw new Error(
            'Connection issue detected. Please check your internet connection and try again.'
          );
        } else {
          throw new Error(
            'Failed to generate AI plan. Please try again or contact support if the issue persists.'
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      toast.success('✅ AI plan generated successfully');
      console.log('AI plan generated:', {
        categoryId: variables.categoryId,
        promptType: variables.promptType,
        planLength: data.plan?.length || 0,
      });

      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Generate AI Plan', {
        toastId: 'ai-plan-error',
      });
    },
    retry: (failureCount, error) => {
      if (error.message?.includes('rate limit')) {
        return failureCount < 1;
      } else if (error.message?.includes('network')) {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to save an AI summary to the database
 * @returns {Object} The mutation result
 */
export const useSaveAISummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, formId, summary, type = 'summary' }) => {
      try {
        const result = await saveSummary(patientId, formId, summary, type);

        if (!result) {
          throw new Error('Failed to save AI summary to database');
        }

        return result;
      } catch (error) {
        if (error.message?.includes('permission')) {
          throw new Error("You don't have permission to save AI summaries.");
        } else if (error.message?.includes('network')) {
          throw new Error(
            'Connection issue detected. Please check your internet connection and try again.'
          );
        } else {
          throw new Error('Failed to save AI summary. Please try again.');
        }
      }
    },
    onSuccess: (data, variables) => {
      toast.success('✅ AI summary saved successfully');

      // Invalidate and update the specific summary query
      queryClient.invalidateQueries({
        queryKey: summaryQueryKeys.summary(
          variables.patientId,
          variables.formId
        ),
      });
      queryClient.invalidateQueries({ queryKey: summaryQueryKeys.all });
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Save AI Summary', {
        toastId: 'save-ai-summary-error',
      });
    },
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (error.message?.includes('permission')) {
        return false;
      }
      // Retry network errors up to 2 times
      if (error.message?.includes('network')) {
        return failureCount < 2;
      }
      return failureCount < 1;
    },
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
          consultationId, // Using consultationId as patientId for now
          consultationId, // Using consultationId as formId for now
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
          variables.consultationId
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
