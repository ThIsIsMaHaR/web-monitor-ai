import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateSummary(diff) {
  // Pull the Gemini key from Render's environment
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing in Render");
    return "Summary unavailable: Gemini API Key not found.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the faster, free-tier friendly model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a web monitor. Summarize the following website content changes:
      ${diff}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    return `Summary unavailable: AI error (${error.message})`;
  }
}