import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import linkRoutes from "./routes/linkRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. UPDATED SECURITY (Flexible for Vite/React)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Added unsafe-eval for some React builds
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Turn this off to allow external resources
  })
);

app.use(cors());
app.use(express.json());

// 2. ROUTES
app.use("/links", linkRoutes);

app.get("/status", (req, res) => {
  res.json({
    backend: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY ? "configured" : "missing"
  });
});

// 3. STATIC FILES
// This is the safest way to find the dist folder on Render
const rootDir = process.cwd();
const buildPath = path.join(rootDir, "client", "dist");

app.use(express.static(buildPath));

// 4. CATCH-ALL
app.get("/*path", (req, res) => {
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      console.error("❌ File not found:", path.join(buildPath, "index.html"));
      res.status(500).send("Build files missing on server.");
    }
  });
});

// DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;