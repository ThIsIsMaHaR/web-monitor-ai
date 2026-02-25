import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import linkRoutes from "./routes/linkRoutes.js";

// Load environment variables
dotenv.config();

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. SECURITY & CSP FIX
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true, 
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        // Specific whitelist for Google Fonts
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
      },
    },
  })
);

// FORCE CACHE REFRESH: Tells browser the security headers have changed
app.use((req, res, next) => {
  res.setHeader("Clear-Site-Data", '"cache"'); 
  next();
});

app.use(cors());
app.use(express.json());

// 2. API ROUTES
app.use("/links", linkRoutes);

app.get("/status", async (req, res) => {
  res.json({
    backend: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY ? "configured" : "missing"
  });
});

// 3. STATIC FILES
const buildPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

// 4. CATCH-ALL (EXPRESS 5 COMPLIANT)
app.get("/*path", (req, res) => {
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send("Frontend build not found. Run 'npm run build'.");
    }
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;