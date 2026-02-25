import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI ERROR: API Key missing from Environment Variables");
    return "AI Summary unavailable: Missing API Key.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Configure the model with permissive safety settings for technical diffs
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
    // Sanitize and truncate the content (AI handles clean text better)
    const sanitizedContent = content ? content.substring(0, 2000) : "";

    if (!sanitizedContent || sanitizedContent.length < 5) {
      return "No changes detected to summarize.";
    }

    const prompt = `INSTRUCTIONS: You are a web monitor. 
      The content below shows changes [ADDED] or [REMOVED] from a webpage.
      1. IGNORE all code, JSON, and CSS.
      2. Summarize what actually changed on the page in 2 short sentences.
      3. If the change is only technical code/IDs, say: "Technical updates to site structure."

      CONTENT:
      ${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim() || "Technical update detected.";
    
  } catch (error) {
    // This logs the FULL error object to Render Logs for debugging
    console.error("❌ GEMINI FULL ERROR:", error);

    // Specific check for the Region/Location issue
    if (error.message?.includes("location") || error.message?.includes("supported") || error.status === 400) {
      return "AI Region Error: Google is blocking this Render IP. Please add NODE_OPTIONS=--dns-result-order=ipv6first to Render Env Vars.";
    }

    return `Summary unavailable: AI service error.`;
  }
}