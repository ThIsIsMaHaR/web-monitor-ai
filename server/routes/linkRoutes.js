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
  try {
    const link = await Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Fetch current content
    const newContent = await fetchPageText(link.url);

    // Get last snapshot
    const lastCheck = await CheckHistory.findOne({ linkId: link._id })
      .sort({ createdAt: -1 });

    const oldContent = lastCheck?.contentSnapshot || "";

    // Generate diff
    const diff = generateDiff(oldContent, newContent);

    // 🚨 If no changes detected, skip OpenAI call
    if (!diff || diff.trim() === "") {
      return res.json({
        message: "No changes detected",
        linkId: link._id
      });
    }

    // Generate summary via LLM
    const summary = await generateSummary(diff);

    // Save new check
    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff,
      summary
    });

    // Keep only last 5 checks
    const checks = await CheckHistory.find({ linkId: link._id })
      .sort({ createdAt: -1 });

    if (checks.length > 5) {
      const extraChecks = checks.slice(5);
      for (let check of extraChecks) {
        await CheckHistory.findByIdAndDelete(check._id);
      }
    }

    res.json(newCheck);

  } catch (err) {
    res.status(500).json({ error: err.message });
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