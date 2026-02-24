import OpenAI from "openai";

export async function generateSummary(content) {
  // 1. Validate if key exists
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("❌ OPENAI_API_KEY is missing in Render environment variables.");
    return "Summary unavailable: No API key found.";
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Most cost-effective model for summaries
      messages: [
        {
          role: "system",
          content: "You summarize website content changes clearly and concisely.",
        },
        {
          role: "user",
          content: `Here is the difference in content from a website. Summarize what changed: \n\n${content}`,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);
    
    // Check for specific OpenAI errors (like Quota)
    if (error.message.includes("insufficient_quota")) {
      return "Summary unavailable: OpenAI account out of credits.";
    }
    
    return `Summary unavailable: AI error (${error.message})`;
  }
}