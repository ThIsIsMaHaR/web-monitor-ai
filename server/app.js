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

app.use(helmet({
  contentSecurityPolicy: false, // Disabling temporarily to confirm it's not a block
  crossOriginEmbedderPolicy: false 
}));
app.use(cors());
app.use(express.json());

app.use("/links", linkRoutes);

// --- DYNAMIC PATH DETECTION ---
const rootDir = process.cwd();
const possiblePaths = [
  path.join(rootDir, "client", "dist"),
  path.join(rootDir, "frontend", "dist"),
  path.join(rootDir, "dist"),
  path.join(rootDir, "client", "build"),
  path.join(rootDir, "build")
];

let buildPath = possiblePaths.find(p => fs.existsSync(path.join(p, "index.html")));

if (buildPath) {
  console.log("✅ SUCCESS: Serving frontend from:", buildPath);
  app.use(express.static(buildPath));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("❌ ERROR: No build folder found in any of these locations:", possiblePaths);
  app.get("/", (req, res) => res.send("Backend is running, but Frontend build is missing. Check logs."));
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;