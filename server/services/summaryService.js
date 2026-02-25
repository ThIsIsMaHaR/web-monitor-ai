import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function generateSummary(content) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "AI Summary unavailable: Missing API Key.";

  // FORCE IPv6 via code as a last-ditch effort for Render
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
    console.error("❌ ERROR LOG:", error.message);
    
    // If the error persists, it's definitely the IP address of the Render server
    if (error.message.includes("location") || error.status === 400) {
      return "AI Location Error: Render's IP is blocked by Google. Try using a US-based Proxy or a new API Key.";
    }
    return "Summary unavailable: AI service error.";
  }
}