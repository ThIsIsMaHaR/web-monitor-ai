import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing from process.env!");
    return "AI Summary unavailable (Check API Key)";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Clean the content a bit to prevent prompt injection or excessive tokens
    const cleanContent = content.substring(0, 5000); 
    
    const prompt = `You are a professional web monitoring assistant. 
    Summarize the following website changes or content into 2-3 concise bullet points: 
    
    ${cleanContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "No summary could be generated.";
  } catch (error) {
    // This will catch 401 (Invalid Key) or 429 (Rate Limit)
    console.error("❌ Gemini API Error:", error.message);
    
    if (error.message.includes("401")) return "Summary unavailable: Invalid API Key.";
    if (error.message.includes("429")) return "Summary unavailable: Rate limit exceeded.";
    
    return "AI Summary unavailable (Check API Key)";
  }
}