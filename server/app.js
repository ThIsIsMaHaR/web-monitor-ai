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

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Relaxed for initial deployment success
  crossOriginEmbedderPolicy: false 
}));
app.use(cors());
app.use(express.json());

// API Routes
app.use("/links", linkRoutes);

// --- STATIC FILE SERVING ---
// Since app.js is inside /server, and 'npm run build' runs inside /server,
// the 'dist' folder will be created at /server/dist.
const buildPath = path.join(__dirname, "dist");

console.log("🛠️  SYSTEM: Attempting to serve from:", buildPath);

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.status(200).send("Backend is live. Frontend build (dist) not found yet.");
  });
}

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;