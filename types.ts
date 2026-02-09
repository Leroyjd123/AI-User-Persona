export interface AdvancedSettings {
  // Identity
  customName?: string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Any';
  ageRange: string;
  nationality: string;
  
  // Mindset
  techLiteracy: number; // 1-3 (Novice, Competent, Expert)
  buyingPower: 'Budget' | 'Value' | 'Premium' | 'Enterprise';
  vibe: string;
  currentSolution: string;
  
  // Context
  contextOfUse: string;
  decisionPower: string;
  constraints: string[];
}

export interface PersonaInput {
  productName: string;
  problem: string;
  demographic: string;
  advancedSettings?: AdvancedSettings;
}

export interface Persona {
  name: string;
  age: number;
  occupation: string;
  location: string;
  quote: string;
  bio: string;
  motivations: string[];
  frustrations: string[];
  brands: string[];
  avatarUrl: string; // URL to avataaars.io
  chatInstructions?: string; // Specific instructions for the chat model
  advancedTraits?: AdvancedSettings; // Store the settings used to generate this persona
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ViewState = 'generate' | 'profile' | 'interview';