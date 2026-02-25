import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return "AI Summary unavailable: Missing API Key.";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const sanitizedContent = content ? content.substring(0, 2000) : "";
    if (sanitizedContent.length < 20) return "No significant changes to summarize.";

    const prompt = `Summarize these website changes in two short sentences: ${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error("❌ API ERROR:", error.message);
    
    // If Google blocks the Render IP, we show a clear message
    if (error.message.includes("location") || error.message.includes("400")) {
      return "AI Restricted: Move Render server to US region or use a different API key.";
    }
    return "AI temporary error - Check back in a moment.";
  }
}