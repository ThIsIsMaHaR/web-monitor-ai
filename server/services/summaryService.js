import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;

  // --- 🛠️ RENDER DEBUG LOGS ---
  console.log("--- AI SERVICE CHECK ---");
  console.log("Current Time:", new Date().toLocaleTimeString());
  console.log("Key Found in Env:", !!apiKey);
  if (apiKey) {
    console.log("Key starts with:", apiKey.substring(0, 4));
    console.log("Key length:", apiKey.length);
  } else {
    console.warn("CRITICAL: GEMINI_API_KEY is missing from Render Dashboard!");
  }
  console.log("------------------------");

  // FIX: We RETURN a string instead of THROWING an error.
  // This ensures the database saves the check and the timestamp updates on your site!
  if (!apiKey) {
    return "AI Summary unavailable: Missing API Key in Render Settings.";
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
    const sanitizedContent = content ? content.substring(0, 2000) : "";
    if (sanitizedContent.length < 20) return "No significant changes to summarize.";

    const prompt = `Summarize these website changes in two short sentences. Ignore code. 
      If it's just technical metadata, say 'Technical site update.'
      CONTENT: ${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim() || "AI returned empty response.";
    
  } catch (error) {
    console.error("❌ GEMINI API ERROR:", error.message);
    
    if (error.message.includes("location") || error.status === 400) {
      return "AI Location Error: Render's IP is restricted by Google.";
    }
    return `Summary unavailable: ${error.message.substring(0, 30)}...`;
  }
}