import express from "express";
import Link from "../models/Link.js";
import CheckHistory from "../models/CheckHistory.js";
import { fetchPageText } from "../services/fetchService.js";
import { generateDiff } from "../services/diffService.js";
import { generateSummary } from "../services/summaryService.js";

const router = express.Router();

// 1. Create a link
router.post("/", async (req, res) => {
  try {
    const { url, title, tags } = req.body;
    const newLink = await Link.create({ url, title, tags: tags || [] });
    res.status(201).json(newLink);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all links
router.get("/", async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. THE CHECK ROUTE (Debugging AI)
router.post("/:id/check", async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 STARTING CHECK for link ID: ${id}`);
  
  try {
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    // Step A: Fetch
    console.log(`🌐 Fetching content for: ${link.url}`);
    const newContent = await fetchPageText(link.url);
    
    // Step B: Compare
    const lastCheck = await CheckHistory.findOne({ linkId: link._id }).sort({ createdAt: -1 });
    const oldContent = lastCheck?.contentSnapshot || "";
    const diff = generateDiff(oldContent, newContent);

    // Step C: AI Summary
    console.log(`🤖 Requesting AI Summary...`);
    let summary = "";
    try {
      // Use the whole content if it's the first check, otherwise use the diff
      const aiInput = (oldContent === "") ? newContent.substring(0, 3000) : diff;
      summary = await generateSummary(aiInput);
      console.log(`✅ AI Summary generated successfully`);
    } catch (aiErr) {
      console.error("❌ AI ERROR:", aiErr.message);
      summary = "AI Summary failed. Check your API Key in Render Environment Variables.";
    }

    // Step D: Save
    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff: diff || "Initial check",
      summary: summary
    });

    res.json(newCheck);
  } catch (err) {
    console.error("❌ CHECK ROUTE CRASHED:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get history
router.get("/:id/history", async (req, res) => {
  try {
    const checks = await CheckHistory.find({ linkId: req.params.id }).sort({ createdAt: -1 });
    res.json(checks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;