import { supabase } from '../../lib/supabase';
import { ErrorHandler, fallbackProvider } from '../../utils/errorHandling';

const errorHandler = new ErrorHandler('AI API');

// Default prompts for fallback scenarios
const DEFAULT_PROMPTS = {
  summary: [
    {
      id: 'default-summary-1',
      name: 'Basic Summary',
      content: 'Please provide a concise summary of the patient information.',
      category: 'summary',
      prompt_type: 'summary',
      section: 'general',
    },
  ],
  assessment: [
    {
      id: 'default-assessment-1',
      name: 'Basic Assessment',
      content:
        'Please provide a clinical assessment based on the information provided.',
      category: 'assessment',
      prompt_type: 'assessment',
      section: 'general',
    },
  ],
  plan: [
    {
      id: 'default-plan-1',
      name: 'Basic Plan',
      content: 'Please provide a treatment plan based on the assessment.',
      category: 'plan',
      prompt_type: 'plan',
      section: 'general',
    },
  ],
};

// Set up fallback data
fallbackProvider.setDefaults('ai_prompts', []);
fallbackProvider.setDefaults('ai_prompts_summary', DEFAULT_PROMPTS.summary);
fallbackProvider.setDefaults(
  'ai_prompts_assessment',
  DEFAULT_PROMPTS.assessment
);
fallbackProvider.setDefaults('ai_prompts_plan', DEFAULT_PROMPTS.plan);

// Fetch all AI prompts with enhanced error handling
export const fetchPrompts = async () => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const prompts = data || [];

    // Cache successful response
    fallbackProvider.cacheData('ai_prompts', prompts);

    console.log('✅ Successfully fetched', prompts.length, 'AI prompts');
    return prompts;
  } catch (error) {
    errorHandler.handleError(error, 'Fetch AI Prompts', {
      toastId: 'fetch-prompts-error',
    });

    // Return fallback data
    const fallbackPrompts = fallbackProvider.getFallback('ai_prompts');

    if (fallbackPrompts && fallbackPrompts.length > 0) {
      console.warn('📦 Using cached AI prompts due to fetch error');
      return fallbackPrompts;
    } else {
      console.warn('📦 Using default AI prompts due to fetch error');
      return [
        ...DEFAULT_PROMPTS.summary,
        ...DEFAULT_PROMPTS.assessment,
        ...DEFAULT_PROMPTS.plan,
      ];
    }
  }
};

// Fetch a single AI prompt by ID
export const fetchPrompt = async (promptId) => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error) {
      console.error(`Error fetching prompt ${promptId}:`, error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchPrompt:', error);
    throw error;
  }
};

// Create a new AI prompt
export const createPrompt = async (promptData) => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .insert({
        name: promptData.name,
        prompt: promptData.prompt,
        category: promptData.category,
        prompt_type: promptData.prompt_type,
        section: promptData.section,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createPrompt:', error);
    throw error;
  }
};

// Update an existing AI prompt
export const updatePrompt = async (promptData) => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({
        name: promptData.name,
        prompt: promptData.prompt,
        category: promptData.category,
        prompt_type: promptData.prompt_type,
        section: promptData.section,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptData.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating prompt ${promptData.id}:`, error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updatePrompt:', error);
    throw error;
  }
};

// Delete an AI prompt
export const deletePrompt = async (promptId) => {
  try {
    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId);

    if (error) {
      console.error(`Error deleting prompt ${promptId}:`, error);
      throw new Error(error.message);
    }

    return { success: true, id: promptId };
  } catch (error) {
    console.error('Error in deletePrompt:', error);
    throw error;
  }
};

// Test an AI prompt
export const testPrompt = async (testData) => {
  try {
    const { promptId, testInput } = testData;

    // Fetch the prompt
    const prompt = await fetchPrompt(promptId);

    if (!prompt) {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }

    // Fetch AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      throw new Error('Failed to fetch AI settings');
    }

    // Call the AI service
    const response = await fetch('/api/ai/test-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.prompt,
        input: testInput,
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Request failed with status ${response.status}`
      );
    }

    const result = await response.json();

    // Log the test
    await supabase.from('ai_logs').insert({
      prompt_id: promptId,
      input: testInput,
      output: result.output,
      tokens_used: result.tokens_used,
      duration_ms: result.duration_ms,
      status: 'success',
      created_at: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error('Error in testPrompt:', error);

    // Log the error
    if (testData && testData.promptId) {
      await supabase.from('ai_logs').insert({
        prompt_id: testData.promptId,
        input: testData.testInput,
        status: 'error',
        error: error.message,
        created_at: new Date().toISOString(),
      });
    }

    throw error;
  }
};

// Fetch AI settings
export const fetchAISettings = async () => {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching AI settings:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchAISettings:', error);
    throw error;
  }
};

// Update AI settings
export const updateAISettings = async (settingsData) => {
  try {
    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('ai_settings')
      .select('id')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking AI settings:', checkError);
      throw new Error(checkError.message);
    }

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('ai_settings')
        .update({
          ...settingsData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating AI settings:', error);
        throw new Error(error.message);
      }

      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('ai_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating AI settings:', error);
        throw new Error(error.message);
      }

      result = data;
    }

    return result;
  } catch (error) {
    console.error('Error in updateAISettings:', error);
    throw error;
  }
};

// Fetch AI logs
export const fetchAILogs = async (options = {}) => {
  try {
    const { limit = 100, offset = 0, promptId } = options;

    let query = supabase
      .from('ai_logs')
      .select('*, ai_prompts(name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (promptId) {
      query = query.eq('prompt_id', promptId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching AI logs:', error);
      throw new Error(error.message);
    }

    return {
      logs: data || [],
      totalLogs: count || 0,
    };
  } catch (error) {
    console.error('Error in fetchAILogs:', error);
    throw error;
  }
};

// Fetch AI metrics
export const fetchAIMetrics = async () => {
  try {
    // Get total prompts count
    const { count: promptsCount, error: promptsError } = await supabase
      .from('ai_prompts')
      .select('*', { count: 'exact', head: true });

    if (promptsError) {
      console.error('Error fetching prompts count:', promptsError);
      throw new Error(promptsError.message);
    }

    // Get total logs count
    const { count: logsCount, error: logsError } = await supabase
      .from('ai_logs')
      .select('*', { count: 'exact', head: true });

    if (logsError) {
      console.error('Error fetching logs count:', logsError);
      throw new Error(logsError.message);
    }

    // Get total tokens used
    const { data: tokensData, error: tokensError } = await supabase
      .from('ai_logs')
      .select('tokens_used');

    if (tokensError) {
      console.error('Error fetching tokens used:', tokensError);
      throw new Error(tokensError.message);
    }

    const totalTokens = tokensData.reduce(
      (sum, log) => sum + (log.tokens_used || 0),
      0
    );

    // Get success rate
    const { data: statusData, error: statusError } = await supabase
      .from('ai_logs')
      .select('status');

    if (statusError) {
      console.error('Error fetching status data:', statusError);
      throw new Error(statusError.message);
    }

    const successCount = statusData.filter(
      (log) => log.status === 'success'
    ).length;
    const successRate =
      statusData.length > 0 ? (successCount / statusData.length) * 100 : 0;

    return {
      promptsCount,
      logsCount,
      totalTokens,
      successRate,
      // Add more metrics as needed
    };
  } catch (error) {
    console.error('Error in fetchAIMetrics:', error);
    throw error;
  }
};

// Get prompt by category, type, and section
export const getPromptByCategoryTypeAndSection = async (
  category,
  type,
  section
) => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('category', category)
      .eq('prompt_type', type)
      .eq('section', section)
      .single();

    if (error) {
      console.error(
        `Error fetching prompt for ${category}/${type}/${section}:`,
        error
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getPromptByCategoryTypeAndSection:', error);
    throw error;
  }
};
