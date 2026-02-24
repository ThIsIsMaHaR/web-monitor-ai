import axios from "axios";
import * as cheerio from "cheerio";

export const fetchPageText = async (url) => {
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
};