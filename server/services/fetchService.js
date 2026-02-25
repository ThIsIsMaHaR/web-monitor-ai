import axios from "axios";
import * as cheerio from "cheerio";

export const fetchPageText = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);

    // REMOVE NOISY TAGS
    $("script, style, nav, footer, header, noscript, svg").remove();

    // Get only the text from the body, trim extra whitespace
    const cleanText = $("body").text().replace(/\s\s+/g, ' ').trim();

    // Return only the first 4000 characters to keep it AI-friendly
    return cleanText.substring(0, 4000);
  } catch (error) {
    throw new Error(`Failed to fetch page: ${error.message}`);
  }
};