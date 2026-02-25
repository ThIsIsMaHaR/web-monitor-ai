import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;

  // --- DEBUG LOGS FOR RENDER ---
  console.log("--- GEMINI DEBUG ---");
  console.log("Key Found in Env:", !!apiKey);
  if (apiKey) {
    console.log("Key starts with:", apiKey.substring(0, 4));
    console.log("Key length:", apiKey.length);
  }
  console.log("--------------------");

  if (!apiKey) {
    // We throw an error here so the controller knows to stop
    throw new Error("Missing API Key in Environment Variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  try {
    const sanitizedContent = content ? content.substring(0, 1500) : "";
    if (sanitizedContent.length < 10) return "No significant changes to summarize.";

    const prompt = `Summarize these website changes in two short sentences. Ignore code. 
      If it's just technical metadata, say 'Technical site update.'
      CONTENT: ${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error("❌ GEMINI API ERROR:", error.message);
    
    if (error.message.includes("location") || error.status === 400) {
      return "AI Location Error: Render's IP is blocked. Try a new API Key or check Render Region.";
    }
    return "Summary unavailable: AI service error.";
  }
}