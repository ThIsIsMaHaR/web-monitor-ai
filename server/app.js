import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import linkRoutes from "./routes/linkRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Security (Relaxed CSP for initial deploy success)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// API Routes
app.use("/links", linkRoutes);

// --- DYNAMIC FRONTEND DISCOVERY ---
const rootDir = process.cwd();
const possiblePaths = [
  path.join(rootDir, "server", "dist"),
  path.join(rootDir, "dist"),
  path.join(__dirname, "dist"),
  path.join(__dirname, "..", "dist")
];

const buildPath = possiblePaths.find(p => fs.existsSync(path.join(p, "index.html")));

if (buildPath) {
  console.log("✅ SYSTEM: Serving frontend from:", buildPath);
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/links")) return res.status(404).json({ error: "API not found" });
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("⚠️ SYSTEM: No build folder found. Backend-only mode.");
  app.get("/", (req, res) => res.send("Backend live. Frontend build still in progress or missing."));
}

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;