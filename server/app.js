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

// 1. SECURITY (Explicitly allowing Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "script-src-elem": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "style-src-elem": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json());

// 2. API ROUTES
app.use("/links", linkRoutes);

app.get("/status", (req, res) => {
  res.json({
    backend: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY ? "configured" : "missing"
  });
});

// 3. STATIC FILES (The 404 Fix)
const buildPath = path.resolve(process.cwd(), "client", "dist");
app.use(express.static(buildPath));

// 4. CATCH-ALL
app.get("/*path", (req, res) => {
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      // THIS WILL SHOW IN RENDER LOGS IF IT FAILS
      console.error("❌ FRONTEND MISSING AT:", indexPath);
      res.status(500).send("Build files not found. Check build command.");
    }
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

export default app;