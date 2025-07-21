import { ai } from './genkit';

/**
 * Generate content using the configured AI model
 * @param prompt - The prompt to send to the AI
 * @returns Promise<string> - The generated content
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    // Use the genkit AI instance to generate content
    const response = await ai.generate({
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    return response.text || 'AI generation failed. Please try again.';
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Return a fallback response instead of throwing
    return 'AI service temporarily unavailable. Please enter content manually.';
  }
}

/**
 * Generate structured content with specific formatting
 * @param prompt - The prompt to send to the AI
 * @param format - The expected format (json, markdown, etc.)
 * @returns Promise<string> - The generated content
 */
export async function generateStructuredContent(
  prompt: string, 
  format: 'json' | 'markdown' | 'text' = 'text'
): Promise<string> {
  try {
    const formattedPrompt = `${prompt}\n\nPlease respond in ${format} format.`;
    
    const response = await ai.generate({
      prompt: formattedPrompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 1500,
      }
    });

    return response.text || `AI generation failed. Please provide ${format} content manually.`;
  } catch (error) {
    console.error('Structured AI generation error:', error);
    return `AI service temporarily unavailable. Please provide ${format} content manually.`;
  }
}

/**
 * Generate content with custom configuration
 * @param prompt - The prompt to send to the AI
 * @param config - Custom configuration options
 * @returns Promise<string> - The generated content
 */
export async function generateWithConfig(
  prompt: string,
  config: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  } = {}
): Promise<string> {
  try {
    const defaultConfig = {
      temperature: 0.7,
      maxOutputTokens: 1000,
      ...config
    };

    const response = await ai.generate({
      prompt: prompt,
      config: defaultConfig
    });

    return response.text || 'AI generation failed. Please try again.';
  } catch (error) {
    console.error('Custom AI generation error:', error);
    return 'AI service temporarily unavailable. Please enter content manually.';
  }
}
