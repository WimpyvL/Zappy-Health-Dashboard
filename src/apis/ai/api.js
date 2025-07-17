
import { supabase } from '../../lib/supabase';
import { ErrorHandler } from '../../utils/errorHandling';

const errorHandler = new ErrorHandler('AI API');

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
    console.log('✅ Successfully fetched', prompts.length, 'AI prompts');
    return prompts;
  } catch (error) {
    errorHandler.handleError(error, 'Fetch AI Prompts', {
      toastId: 'fetch-prompts-error',
    });
    // Removed fallback logic to surface errors
    throw error;
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
      // Don't throw, just return null if not found
      if (error.code !== 'PGRST116') {
        console.error(
          `Error fetching prompt for ${category}/${type}/${section}:`,
          error
        );
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getPromptByCategoryTypeAndSection:', error);
    throw error;
  }
};
