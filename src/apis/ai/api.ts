import { dbService } from '@/services/database';
import { AIPrompt, AISettings, AILog } from './types'; // Assuming a types.ts file exists

const fetchPrompts = async () => {
  return await dbService.getAll<AIPrompt>('ai_prompts', { sortBy: 'created_at', sortDirection: 'desc' });
};

const fetchPrompt = async (promptId: string) => {
  return await dbService.getById<AIPrompt>('ai_prompts', promptId);
};

const createPrompt = async (promptData: Omit<AIPrompt, 'id' | 'created_at' | 'updated_at'>) => {
  return await dbService.create('ai_prompts', promptData);
};

const updatePrompt = async (promptId: string, promptData: Partial<AIPrompt>) => {
  return await dbService.update('ai_prompts', promptId, promptData);
};

const deletePrompt = async (promptId: string) => {
  return await dbService.delete('ai_prompts', promptId);
};

const fetchAISettings = async () => {
  return await dbService.getById<AISettings>('ai_settings', 'singleton');
};

const updateAISettings = async (settingsData: Partial<AISettings>) => {
  // Using update with a specific ID. dbService 'update' will handle creating/merging if underlying logic supports it.
  // For Firestore, this assumes the 'singleton' document exists. A 'set' with merge might be better.
  // Let's assume for now the service handles this.
  return await dbService.update('ai_settings', 'singleton', settingsData);
};

const fetchAILogs = async (options: { limit?: number; promptId?: string } = {}) => {
  const filters = [];
  if (options.promptId) {
    filters.push({ field: 'prompt_id', op: '==', value: options.promptId });
  }
  return await dbService.getAll<AILog>('ai_logs', {
    filters,
    sortBy: 'created_at',
    sortDirection: 'desc',
    pageSize: options.limit || 100,
  });
};

const getPromptByCategoryTypeAndSection = async (category: string, type: string, section: string) => {
  const response = await dbService.getAll<AIPrompt>('ai_prompts', {
    filters: [
      { field: 'category', op: '==', value: category },
      { field: 'prompt_type', op: '==', value: type },
      { field: 'section', op: '==', value: section },
    ],
    pageSize: 1,
  });
  if (response.data && response.data.length > 0) {
    return { data: response.data[0], error: null };
  }
  return { data: null, error: response.error || 'Prompt not found' };
};

const aiApi = {
  fetchPrompts,
  fetchPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  fetchAISettings,
  updateAISettings,
  fetchAILogs,
  getPromptByCategoryTypeAndSection,
};

export default aiApi;