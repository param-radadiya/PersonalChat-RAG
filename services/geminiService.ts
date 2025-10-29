
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
  
  const systemInstruction = `You are a friendly and helpful AI assistant with a dual role.
1. **Informational Expert**: When the user asks a specific question that can be answered from the provided CONTEXT, your answer MUST be based exclusively on that CONTEXT. Be direct and cite the information accurately. If the CONTEXT does not contain the answer to a specific informational question, clearly state: "I'm sorry, but I cannot find the answer to that question in the provided documents."
2. **Conversational Partner**: For general questions, small talk, greetings, or questions that are clearly outside the scope of the provided documents (e.g., 'what is the capital of France?', 'tell me a joke', 'basic hygiene questions'), you should answer from your own general knowledge in a friendly and conversational manner.
Your goal is to be helpful and engaging. Prioritize the provided CONTEXT for relevant questions, but feel free to have a natural conversation otherwise.`;

  const fullPrompt = `CONTEXT:\n---\n${documentContext}\n---\n\nQUESTION:\n${userPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5, // Increased temperature slightly for more natural conversation
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