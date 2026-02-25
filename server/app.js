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

// 1. SECURITY & MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false })); 
app.use(cors());
app.use(express.json());

// 2. API ROUTES
// Define these FIRST
app.use("/links", linkRoutes);

// 3. FRONTEND SERVING
const buildPath = path.join(__dirname, "client", "dist");

console.log("🛠️  SYSTEM: Looking for frontend at:", buildPath);

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  app.use(express.static(buildPath));
  
  /**
   * EXPRESS 5 STABLE FIX:
   * The new path-to-regexp requires named parameters.
   * "/:splat(.*)" names the capture group "splat" and 
   * matches everything that follows.
   */
  app.get("/:splat(.*)", (req, res) => {
    // If an API call accidentally hits this, return 404
    if (req.path.startsWith("/links")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("❌ ERROR: dist folder not found at:", buildPath);
  app.get("/", (req, res) => {
    res.send("Backend is live. Frontend build not found.");
  });
}

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;