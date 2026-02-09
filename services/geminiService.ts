import { GoogleGenAI, Type } from "@google/genai";
import { Persona, PersonaInput } from "../types";
import { GENERATE_PERSONA_PROMPT, SYSTEM_INSTRUCTION_TEMPLATE } from "./prompts";

// Helper to ensure API Key exists
const getAiClient = (customKey?: string) => {
  const apiKey = customKey || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable is not set and no custom key provided.");
  }
  return new GoogleGenAI({ apiKey });
};

// Error parsing helper
const parseApiError = (err: any): string => {
  console.error("Original API Error:", err);

  let message = err.message || "";

  // Try to extract nested JSON error message
  if (typeof message === 'string' && (message.includes('{') || message.includes('}'))) {
    try {
      // Find the first '{' and last '}' to extract potential JSON
      const start = message.indexOf('{');
      const end = message.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonStr = message.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        // Handle common Google API error formats
        message = parsed.error?.message || parsed.message || message;
      }
    } catch (e) {
      console.warn("Failed to parse nested error JSON", e);
    }
  }

  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return "Invalid API Key. Please check your key and try again.";
  }

  if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    return "API Quota Exceeded. Please try again later or check your billing status.";
  }

  return typeof message === 'string' ? message : "An unexpected error occurred. Please try again.";
};

// 1. Generate Persona (Text & Avatar Config)
export const generatePersonaProfile = async (input: PersonaInput, apiKey?: string): Promise<Persona> => {
  try {
    const ai = getAiClient(apiKey);
    const prompt = GENERATE_PERSONA_PROMPT(input);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.INTEGER },
            occupation: { type: Type.STRING },
            location: { type: Type.STRING },
            quote: { type: Type.STRING },
            bio: { type: Type.STRING },
            motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
            frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
            brands: { type: Type.ARRAY, items: { type: Type.STRING } },
            chatInstructions: { type: Type.STRING, description: "Detailed system instructions for the chat model to roleplay this specific persona, including tone, literacy level, and biases." },
            avatarConfig: {
              type: Type.OBJECT,
              properties: {
                topType: { type: Type.STRING },
                accessoriesType: { type: Type.STRING },
                hairColor: { type: Type.STRING },
                facialHairType: { type: Type.STRING },
                clotheType: { type: Type.STRING },
                skinColor: { type: Type.STRING },
                eyeType: { type: Type.STRING },
                eyebrowType: { type: Type.STRING },
                mouthType: { type: Type.STRING }
              }
            }
          },
          required: ["name", "age", "occupation", "location", "quote", "bio", "motivations", "frustrations", "brands", "avatarConfig", "chatInstructions"]
        }
      }
    });

    if (!response.text) throw new Error("No response from AI");

    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // Construct Avataaars URL
    const params = new URLSearchParams({
      avatarStyle: 'Circle',
      ...data.avatarConfig
    });
    const avatarUrl = `https://avataaars.io/?${params.toString()}`;

    return {
      ...data,
      avatarUrl
    } as Persona;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
};

// Exporting the system instruction getter for UI display
export const getSystemInstruction = SYSTEM_INSTRUCTION_TEMPLATE;

// 2. Chat Session (Text)
export const createChatSession = (persona: Persona, apiKey?: string) => {
  const ai = getAiClient(apiKey);
  const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE(persona);

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};