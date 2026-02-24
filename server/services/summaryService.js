import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateSummary(diff) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing");
    return "Summary unavailable: API Key not configured.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a website change monitor. 
      Summarize the following website changes clearly for a user.
      
      Changes:
      ${diff}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    return "Summary unavailable: AI service error.";
  }
}