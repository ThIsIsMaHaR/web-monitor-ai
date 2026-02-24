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

// 3. THE CHECK ROUTE (Fixed for Express 5)
router.post("/:id/check", async (req, res) => {
  console.log(`Checking link: ${req.params.id}`);
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    // Step A: Fetch content (Added timeout protection)
    let newContent;
    try {
      newContent = await fetchPageText(link.url);
    } catch (fetchErr) {
      return res.status(500).json({ error: "Website blocked the check", details: fetchErr.message });
    }

    // Step B: Get last snapshot
    const lastCheck = await CheckHistory.findOne({ linkId: link._id }).sort({ createdAt: -1 });
    const oldContent = lastCheck?.contentSnapshot || "";

    // Step C: Generate Diff
    const diff = generateDiff(oldContent, newContent);

    // If no changes, still save a history entry but skip AI to save credits/prevent errors
    if (oldContent !== "" && (!diff || diff.trim() === "")) {
      return res.json({ message: "No changes detected", linkId: link._id });
    }

    // Step D: AI Summary (Added Fallback)
    let summary = "Summary pending...";
    try {
      summary = await generateSummary(diff || "Initial check");
    } catch (aiErr) {
      console.error("AI Service Error:", aiErr.message);
      summary = "AI Summary unavailable (Check API Key)";
    }

    // Step E: Save History
    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff: diff || "Initial snapshot",
      summary
    });

    res.json(newCheck);
  } catch (err) {
    console.error("Critical Check Error:", err);
    res.status(500).json({ error: "Internal Check Failure", details: err.message });
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