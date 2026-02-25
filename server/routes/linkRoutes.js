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
    if (!url) return res.status(400).json({ error: "URL is required" });
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

// 3. THE CHECK ROUTE (Optimized for AI & Dates)
router.post("/:id/check", async (req, res) => {
  const { id } = req.params;
  try {
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    // Step A: Fetch page content
    let newContent;
    try {
      newContent = await fetchPageText(link.url);
    } catch (fetchErr) {
      return res.status(500).json({ error: "Website unreachable", details: fetchErr.message });
    }

    // Step B: Get previous snapshot
    const lastCheck = await CheckHistory.findOne({ linkId: link._id }).sort({ createdAt: -1 });
    const oldContent = lastCheck?.contentSnapshot || "";

    // Step C: Generate Diff
    const diff = generateDiff(oldContent, newContent);

    // Skip if no changes (unless it's the very first check)
    if (oldContent !== "" && (!diff || diff.trim() === "" || diff === "No changes detected")) {
      return res.json({ message: "No changes detected", lastCheck });
    }

    // Step D: AI Summary Logic
    let summary = "";
    try {
      // If no old content, summarize the whole page. If changed, summarize the diff.
      const aiInput = (oldContent === "") ? newContent.substring(0, 2500) : diff;
      summary = await generateSummary(aiInput);
    } catch (aiErr) {
      console.error("❌ AI LOG:", aiErr.message); 
      summary = "Summary unavailable: AI service error.";
    }

    // Step E: Save and Return
    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff: diff || "Initial snapshot",
      summary: summary
    });

    // Explicitly return the new check so the frontend gets the 'createdAt' field
    res.json(newCheck);

  } catch (err) {
    console.error("❌ CHECK FAILURE:", err);
    res.status(500).json({ error: "Internal Error", details: err.message });
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