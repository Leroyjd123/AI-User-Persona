import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger';

import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config(); // Backup to look in current dir

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration for Vercel
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

const getAiClient = (customKey?: string) => {
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.error("GEMINI_API_KEY is missing (no env and no custom key provided)");
        throw new Error("API Key is required");
    }
    return new GoogleGenAI({ apiKey });
};

// --- ENDPOINTS ---

// 1. Generate Persona
app.post('/api/persona/generate', async (req: Request, res: Response) => {
    try {
        const { input, customApiKey } = req.body;
        if (!input) return res.status(400).json({ error: "Input is required" });

        logger.info(`[Generate] Product: ${input.productName} (Auth: ${customApiKey ? 'Custom' : 'Free'})`);
        const ai = getAiClient(customApiKey);

        const adv = input.advancedSettings;
        const prompt = `
      ### SYSTEM ROLE
      You are an advanced User Research Simulator. Create a realistic User Persona based on:
      
      Product: "${input.productName}"
      Problem: "${input.problem}"
      Audience: "${input.demographic || 'General'}"
      
      Advanced Constraints:
      - Gender: ${adv?.gender || 'Any'}
      - Age Range: ${adv?.ageRange || 'Any'}
      - Tech Literacy (1-3): ${adv?.techLiteracy || 'Infer'}
      - Buying Power: ${adv?.buyingPower || 'Infer'}
      - Vibe: ${adv?.vibe || 'Busy but Open'}
      
      ### RESPONSE REQUIREMENT
      Return a JSON object containing:
      "name", "age", "occupation", "location", "quote", "bio", 
      "motivations" (array), "frustrations" (array), "brands" (array), 
      "avatarConfig" (object for avataaars).
      
      IMPORTANT: Respond with JSON only.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = response.text || "";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        res.json({ data: JSON.parse(cleanJson) });
    } catch (error: any) {
        logger.error(`[Generate] Failed: ${error.message}`);
        res.status(error.status || 500).json({ error: error.message || "Generation service failed." });
    }
});

// 2. Chat
app.post('/api/chat/message', async (req: Request, res: Response) => {
    try {
        const { message, history, persona, customApiKey } = req.body;
        logger.info(`[Chat] Persona: ${persona?.name} (Auth: ${customApiKey ? 'Custom' : 'Free'})`);

        const ai = getAiClient(customApiKey);
        const chat = ai.chats.create({
            model: "gemini-1.5-flash",
            history: history?.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            })) || [],
            config: {
                systemInstruction: `You are ${persona?.name}. Bio: ${persona?.bio}. Respond naturally.`
            }
        });

        const result = await chat.sendMessage(message);
        res.json({ text: result.text || "" });
    } catch (error: any) {
        logger.error(`[Chat] Failed: ${error.message}`);
        res.status(500).json({ error: "Messaging service is currently unreachable." });
    }
});

// 3. Text-to-Speech
app.post('/api/tts/generate', async (req: Request, res: Response) => {
    try {
        const { text, customApiKey } = req.body;
        logger.info(`[TTS] Audio request (Auth: ${customApiKey ? 'Custom' : 'Free'})`);

        const ai = getAiClient(customApiKey);
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text }] }],
        });

        res.json({ audio: "BASE64_PLACEHOLDER" });
    } catch (error: any) {
        logger.error(`[TTS] Failed: ${error.message}`);
        res.status(500).json({ error: "Voice synthesis failed." });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Start server
app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port} (Env: ${process.env.NODE_ENV || 'development'})`);
});

export default app;
