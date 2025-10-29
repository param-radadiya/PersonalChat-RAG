
import { GoogleGenAI } from "@google/genai";

// Assume process.env.API_KEY is available
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY not found in environment variables. Please set it up.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getBotResponse = async (
  userPrompt: string,
  documentContext: string
): Promise<string> => {
  if (!API_KEY) {
      return "API Key is not configured. Please contact the administrator.";
  }

  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a friendly and helpful AI assistant. Your primary role is to answer questions based on a provided context.
Follow these rules:
1. First, analyze the user's query. If it's a simple greeting, pleasantry, or conversational filler (e.g., "hello", "how are you?", "thanks!", "who are you?"), respond in a friendly, conversational manner. You do not need to consult the context for these.
2. If the user's query is a specific question asking for information, you MUST answer it based ONLY on the provided text context.
3. When answering from the context, be direct and stick to the information given. Do not add information that is not in the context.
4. If you cannot find the answer to a specific informational question within the context, you MUST respond with: "I'm sorry, but I cannot find the answer to that question in the provided documents." Do not try to answer it from your own knowledge.`;

  const fullPrompt = `CONTEXT:\n---\n${documentContext}\n---\n\nQUESTION:\n${userPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, 
        topP: 0.9,
        topK: 10,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred while communicating with the AI: ${error.message}`;
    }
    return "An unknown error occurred while communicating with the AI.";
  }
};