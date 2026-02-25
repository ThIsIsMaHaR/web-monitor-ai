import axios from "axios";
import * as cheerio from "cheerio";

export const fetchPageText = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 8000
    });

    const $ = cheerio.load(data);

    // 1. Remove all the "noise" tags that contain code/metadata
    $("script, style, nav, footer, header, noscript, svg, symbol").remove();

    // 2. Extract text and clean up whitespace
    const cleanText = $("body").text().replace(/\s\s+/g, ' ').trim();

    // 3. Only send the first 3000 characters (plenty for a summary)
    return cleanText.substring(0, 3000);
  } catch (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
};