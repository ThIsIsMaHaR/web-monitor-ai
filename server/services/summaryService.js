import OpenAI from "openai";

export async function generateSummary(content) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You summarize website content changes clearly and concisely.",
      },
      {
        role: "user",
        content: content,
      },
    ],
  });

  return response.choices[0].message.content;
}