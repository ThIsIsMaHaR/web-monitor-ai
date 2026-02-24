import express from "express";
import Link from "../models/Link.js";
import CheckHistory from "../models/CheckHistory.js";
import { fetchPageText } from "../services/fetchService.js";
import { generateDiff } from "../services/diffService.js";
import { generateSummary } from "../services/summaryService.js";

const router = express.Router();

/**
 * Create a new link
 */
router.post("/", async (req, res) => {
  try {
    const { url, title, tags } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const newLink = await Link.create({
      url,
      title,
      tags: tags || []
    });

    res.status(201).json(newLink);
  } catch (err) {
    console.error("Error creating link:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all links
 */
router.get("/", async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Check a link for changes
 */
router.post("/:id/check", async (req, res) => {
  console.log(`Starting check for ID: ${req.params.id}`);
  
  try {
    const link = await Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // 1. Fetch current content
    console.log(`Fetching content for: ${link.url}`);
    const newContent = await fetchPageText(link.url);
    if (!newContent) throw new Error("Could not fetch page content (empty response)");

    // 2. Get last snapshot
    const lastCheck = await CheckHistory.findOne({ linkId: link._id })
      .sort({ createdAt: -1 });

    const oldContent = lastCheck?.contentSnapshot || "";

    // 3. Generate diff
    const diff = generateDiff(oldContent, newContent);

    // 4. Check logic: If no changes AND it's not the first time
    if (oldContent !== "" && (!diff || diff.trim() === "")) {
      console.log("No changes detected since last check.");
      return res.json({
        message: "No changes detected",
        linkId: link._id
      });
    }

    // 5. Generate summary via LLM (Gemini/OpenAI)
    console.log("Sending diff to AI for summary...");
    const summary = await generateSummary(diff || "Initial snapshot of the page.");

    // 6. Save new check
    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff: diff || "Initial check - no previous data.",
      summary: summary || "Summary could not be generated."
    });

    // 7. Cleanup: Keep only last 5 checks
    const checksCount = await CheckHistory.countDocuments({ linkId: link._id });
    if (checksCount > 5) {
      const oldestChecks = await CheckHistory.find({ linkId: link._id })
        .sort({ createdAt: 1 }) // Oldest first
        .limit(checksCount - 5);
      
      for (let old of oldestChecks) {
        await CheckHistory.findByIdAndDelete(old._id);
      }
    }

    console.log("Check completed successfully!");
    res.json(newCheck);

  } catch (err) {
    // This detailed log will show up in your Render Logs!
    console.error("❌ CRITICAL CHECK ERROR:", {
      message: err.message,
      stack: err.stack,
      linkId: req.params.id
    });

    res.status(500).json({ 
      error: "Check failed", 
      details: err.message 
    });
  }
});

/**
 * Get check history for a link
 */
router.get("/:id/history", async (req, res) => {
  try {
    const checks = await CheckHistory.find({ linkId: req.params.id })
      .sort({ createdAt: -1 });

    res.json(checks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;