import axios from "axios";
import * as cheerio from "cheerio";

export const fetchPageText = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000
    });

    const $ = cheerio.load(data);

    // 1. Delete everything that isn't content
    $("script, style, nav, footer, header, noscript, svg, .Header, .footer").remove();

    // 2. Specifically for GitHub: Try to find the main content area
    let mainContent = $("#readme").text() || $("main").text() || $("body").text();

    // 3. Clean and Truncate heavily
    const cleanText = mainContent.replace(/\s\s+/g, ' ').trim();
    
    // AI works best with shorter, cleaner text
    return cleanText.substring(0, 1500); 
  } catch (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
};