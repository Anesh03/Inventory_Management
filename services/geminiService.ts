import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryInsights = async (
  inventoryData: any,
  userPrompt: string
): Promise<string> => {
  try {
    const systemInstruction = `
      You are an expert AI Inventory Analyst for a hardware store.
      You will be provided with JSON data representing the current state of the inventory, including:
      - Products list with current stock and reorder levels.
      - Recent sales and purchases.
      - Low stock alerts.

      Your goal is to provide actionable insights, identifying trends, suggesting reorders, or spotting anomalies.
      Keep responses professional, concise, and formatted with clear headings or bullet points.
    `;

    const prompt = `
      Here is the current inventory data:
      ${JSON.stringify(inventoryData, null, 2)}

      User Question: ${userPrompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on simple queries
      },
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return "Sorry, I encountered an error while analyzing your inventory. Please check your API configuration.";
  }
};