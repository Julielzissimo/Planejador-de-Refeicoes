import { GoogleGenAI } from "@google/genai";
import { Ingredient } from "../types";

// Initialize the client. API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Asks Gemini to suggest ingredients for a given dish name in JSON format.
 */
export const suggestIngredients = async (dishName: string): Promise<Ingredient[]> => {
  if (!dishName.trim()) return [];

  try {
    const model = 'gemini-2.5-flash';
    // We ask for JSON specifically
    const prompt = `
      Crie uma lista de ingredientes para o prato: "${dishName}".
      Estime quantidades para uma receita familiar (4 pessoas).
      
      Retorne APENAS um JSON válido no seguinte formato, sem markdown, sem explicações:
      [
        { "name": "Arroz", "quantity": 500, "unit": "g" },
        { "name": "Ovo", "quantity": 4, "unit": "un" }
      ]

      Use unidades padrão como: g, kg, ml, l, un, xícara, colher, dente (para alho), maço, etc.
      Se for tempero, use 'a gosto' e quantidade 0.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json" 
      }
    });

    const text = response.text.trim();
    // Parse JSON
    const rawData = JSON.parse(text);
    
    // Map to our Ingredient interface to ensure ID
    return rawData.map((item: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        name: item.name,
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        unit: item.unit || 'un'
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};