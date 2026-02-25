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

// 1. Security & Standard Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true, // Loads standard security defaults
      directives: {
        // Allow resources from your own domain
        "default-src": ["'self'"],
        
        // Allow Google Fonts CSS and internal styles
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        
        // Allow actual font files from Google's static domain
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        
        // Allow images from your site and external HTTPS sources
        "img-src": ["'self'", "data:", "https://*"],
        
        // Allow frontend to talk to your backend
        "connect-src": ["'self'"], 
        
        "object-src": ["'none'"],
      },
    },
  })
);

app.use(cors());
app.use(express.json());

// 2. API Routes
app.use("/links", linkRoutes);

app.get("/status", async (req, res) => {
  res.json({
    backend: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY ? "configured" : "missing"
  });
});

// 3. Serve Frontend Static Files
const buildPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

// 4. Handle Frontend Routing (CATCH-ALL)
// FIXED FOR EXPRESS 5: The wildcard must be named.
app.get("/*path", (req, res) => {
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Frontend Error:", err);
      res.status(500).send("Frontend build not found.");
    }
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;