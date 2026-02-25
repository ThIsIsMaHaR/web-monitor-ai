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
app.use(helmet({
  contentSecurityPolicy: false, // Set to false to prevent initial CSP blocks
  crossOriginEmbedderPolicy: false 
}));
app.use(cors());
app.use(express.json());

// 2. API ROUTES
app.use("/links", linkRoutes);

app.get("/status", (req, res) => {
  res.json({
    backend: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// 3. DYNAMIC STATIC FILE SERVING
const rootDir = process.cwd();

// We check these 3 locations because of your nested 'server' structure
const possibleBuildPaths = [
  path.join(__dirname, "dist"),          // Inside server/dist
  path.join(rootDir, "server", "dist"),  // Absolute path to server/dist
  path.join(rootDir, "dist")             // Root dist (fallback)
];

let buildPath = possibleBuildPaths.find((p) => fs.existsSync(path.join(p, "index.html")));

if (buildPath) {
  console.log("✅ SYSTEM: Frontend found! Serving from:", buildPath);
  app.use(express.static(buildPath));
  
  // Catch-all to support React Router
  app.get("*", (req, res) => {
    // Skip if it's an API route that reached here by mistake
    if (req.path.startsWith("/links")) return res.status(404).json({ error: "API not found" });
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("⚠️  SYSTEM: No 'dist' folder found. Server is in API-only mode.");
  console.log("Checked locations:", possibleBuildPaths);
  app.get("/", (req, res) => {
    res.send("Backend is running. Waiting for frontend build to complete...");
  });
}

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;