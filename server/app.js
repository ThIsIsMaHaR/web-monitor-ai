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
      directives: {
        // Fallback for any directive not specified - 'self' allows your own domain
        "default-src": ["'self'"],
        
        // Allow stylesheets from your site and Google Fonts
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        
        // Allow the actual font files from Google
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        
        // Allow images from your site and any external HTTPS URL
        "img-src": ["'self'", "data:", "https://*"],
        
        // Allow API calls (AJAX/Fetch) to your own server
        "connect-src": ["'self'"], 
        
        // Security best practice: block plugins like Flash
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
// path.resolve steps out of 'server' to find 'client/dist'
const buildPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

// 4. Handle Frontend Routing (CATCH-ALL)
// FIXED FOR EXPRESS 5: Using named parameter '/*path'
app.get("/*path", (req, res) => {
  // Guard: If an API route fails, don't serve the index.html file by mistake
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  const indexPath = path.join(buildPath, "index.html");
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Frontend Error:", err);
      res.status(500).send("Frontend build not found. Ensure 'npm run build' was successful.");
    }
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;