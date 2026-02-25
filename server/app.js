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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// API
app.use("/links", linkRoutes);

// --- DYNAMIC DIST FINDER ---
const findDist = () => {
  const root = process.cwd();
  const trials = [
    path.join(root, "server", "dist"),
    path.join(root, "dist"),
    path.join(__dirname, "dist"),
    path.join(__dirname, "..", "dist")
  ];
  return trials.find(p => fs.existsSync(path.join(p, "index.html")));
};

const buildPath = findDist();

if (buildPath) {
  console.log("✅ SYSTEM: Serving from:", buildPath);
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/links")) return res.status(404).json({ error: "API not found" });
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("Backend live. Build folder (dist) not detected yet."));
}

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ MongoDB Connected"));

export default app;