import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ DEBUG: GEMINI_API_KEY is missing from process.env");
    return "AI Summary unavailable (Check API Key)";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash as it is more stable for free tier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // If content is too short, Gemini might throw an error. 
    // We provide a fallback prompt.
    const prompt = content && content.length > 10 
      ? `Summarize these changes: ${content.substring(0, 5000)}`
      : "A check was performed but no significant text changes were detected.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    // THIS IS THE MOST IMPORTANT PART:
    console.error("❌ GEMINI CRASH DETAILS:", error.message);
    return "Summary unavailable: AI service error.";
  }
}