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

// 1. SECURITY & CSP (Google Fonts Fix Included)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
      },
    },
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

// 3. STATIC FILES (THE FIX IS HERE)
// This ensures we look in the right place regardless of how Render starts the app
const buildPath = path.resolve(process.cwd(), "client", "dist");
app.use(express.static(buildPath));

// 4. CATCH-ALL ROUTE (FIXED FOR EXPRESS 5)
app.get("/*path", (req, res) => {
  // If they are trying to hit an API route that doesn't exist, don't send the HTML
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("❌ CRITICAL: Could not find index.html at", indexPath);
      res.status(500).send(`Frontend files not found. Build path tried: ${indexPath}`);
    }
  });
});

// DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;