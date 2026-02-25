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
app.use(helmet({ contentSecurityPolicy: false })); // Relaxed for deployment
app.use(cors());
app.use(express.json());

// 2. API ROUTES
app.use("/links", linkRoutes);

// 3. FRONTEND SERVING (NESTED STRUCTURE)
// Path: server/client/dist (since client is inside server)
const buildPath = path.join(__dirname, "client", "dist");

console.log("🛠️  SYSTEM: Looking for frontend at:", buildPath);

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  // Serve static files (CSS, JS, Images)
  app.use(express.static(buildPath));
  
  /**
   * EXPRESS 5 FIX:
   * Wildcards must be named. Using "{*splat}" or "/*path"
   * satisfies the new path-to-regexp requirements.
   */
  app.get("/{*splat}", (req, res) => {
    // Prevent API routes from falling into the frontend catch-all
    if (req.path.startsWith("/links")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("❌ ERROR: dist folder not found at:", buildPath);
  app.get("/", (req, res) => {
    res.send("Backend is live. Frontend build not found at /server/client/dist");
  });
}

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;