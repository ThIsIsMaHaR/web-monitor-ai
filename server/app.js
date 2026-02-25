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

// 1. Security Middleware with Google Fonts Whitelist
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Allow your own domain by default
        "default-src": ["'self'"],
        
        // Allow Google Fonts CSS and inline styles
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        
        // Allow the actual font files from Google
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        
        // Allow images from your site and external HTTPS sources
        "img-src": ["'self'", "data:", "https://*"],
        
        // Allow frontend to communicate with your backend
        "connect-src": ["'self'"], 
        
        // Block plugins
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
// Note: Steps out of 'server' folder to find 'client/dist'
const buildPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

// 4. Handle Frontend Routing (CATCH-ALL)
// FIXED FOR EXPRESS 5: Using named wildcard parameter '/*path'
app.get("/*path", (req, res) => {
  // Prevent catching failed API calls
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Frontend Error:", err);
      res.status(500).send("Frontend build not found. Check if 'npm run build' was successful.");
    }
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;