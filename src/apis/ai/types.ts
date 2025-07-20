export interface AIPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  prompt_type: string;
  section: string;
  created_at: string; // ISO String
  updated_at: string; // ISO String
}

export interface AISettings {
  id: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  // other settings...
  updated_at: string; // ISO String
}

export interface AILog {
  id: string;
  prompt_id: string;
  request_payload: object;
  response_payload: object;
  created_at: string; // ISO String
}
