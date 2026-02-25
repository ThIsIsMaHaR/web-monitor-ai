import express from "express";
import Link from "../models/Link.js";
import CheckHistory from "../models/CheckHistory.js";
import { fetchPageText } from "../services/fetchService.js";
import { generateDiff } from "../services/diffService.js";
import { generateSummary } from "../services/summaryService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 RECEIVED POST /links:", req.body);
  try {
    const { url, title, tags } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    const newLink = await Link.create({ url, title, tags: tags || [] });
    res.status(201).json(newLink);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/check", async (req, res) => {
  const { id } = req.params;
  try {
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    const newContent = await fetchPageText(link.url);
    const lastCheck = await CheckHistory.findOne({ linkId: link._id }).sort({ createdAt: -1 });
    const oldContent = lastCheck?.contentSnapshot || "";
    const diff = generateDiff(oldContent, newContent);

    if (oldContent !== "" && (!diff || diff.trim() === "" || diff === "No changes detected")) {
      return res.json({ message: "No changes detected", lastCheck });
    }

    const aiInput = (oldContent === "") ? newContent.substring(0, 2500) : diff;
    const summary = await generateSummary(aiInput);

    const newCheck = await CheckHistory.create({
      linkId: link._id,
      contentSnapshot: newContent,
      diff: diff || "Initial snapshot",
      summary: summary
    });

    res.json(newCheck);
  } catch (err) {
    res.status(500).json({ error: "Internal Error", details: err.message });
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    const checks = await CheckHistory.find({ linkId: req.params.id }).sort({ createdAt: -1 });
    res.json(checks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;