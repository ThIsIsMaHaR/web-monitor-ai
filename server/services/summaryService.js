import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "AI Summary unavailable: Missing API Key.";

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 1. Use the most stable flash model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // 2. Lower safety thresholds so technical diffs aren't blocked as "dangerous"
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  try {
    // 3. Better prompt instructions to handle those "hashes"
    const prompt = `You are a web change detector. Look at this text from a website. 
Ignore CSS, JavaScript code, and technical metadata. 
Summarize any actual content changes or the main purpose of this page in 2 sentences. 
If the content is mostly technical code, say "Technical site structure updated."

CONTENT: ${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No summary available.";
  } catch (error) {
    // This logs the EXACT reason to your Render "Logs" tab
    console.error("❌ GEMINI CRASH:", error.message);
    
    if (error.message.includes("location")) {
      return "AI Error: Render server region not supported by Gemini.";
    }
    return "Summary unavailable: AI service error.";
  }
}