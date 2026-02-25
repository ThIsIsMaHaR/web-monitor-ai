import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI ERROR: API Key missing from Environment Variables");
    return "AI Summary unavailable: Missing API Key.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 1. Configure the model with permissive safety settings for technical text
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
    // 2. Limit content length to prevent "Noise" crashes
    // We take the first 2500 characters to stay within safety/token limits
    const sanitizedContent = content ? content.substring(0, 2500) : "";

    if (!sanitizedContent || sanitizedContent.length < 10) {
      return "No significant text content found to summarize.";
    }

    // 3. Stronger system-style prompt
    const prompt = `INSTRUCTIONS: You are a web monitor assistant. 
      The content below is a mix of website text and technical metadata/code. 
      1. IGNORE all CSS, JSON, JavaScript, and HTML tags.
      2. If the text is purely technical code or IDs, respond ONLY with: "Technical site structure or metadata updated."
      3. If there is human-readable content, summarize the main topic or changes in 2 short sentences.

      CONTENT TO ANALYZE:
      ${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim() || "Summary pending...";
    
  } catch (error) {
    // This will appear in your Render "Logs" tab
    console.error("❌ GEMINI CRASH DETAILS:", error.message);
    
    if (error.message.includes("location") || error.message.includes("supported")) {
      return "AI Error: Render server region (Europe/Asia) not supported by Gemini Free Tier.";
    }
    
    if (error.message.includes("User location")) {
      return "AI Error: Region Restricted. Try a US-based Render server.";
    }

    return "Summary unavailable: AI service error.";
  }
}