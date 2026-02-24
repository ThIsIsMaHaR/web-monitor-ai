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

// 1. Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"], 
      },
    },
  })
);

// 2. Standard Middleware
app.use(cors());
app.use(express.json());

// 3. API Routes
app.use("/links", linkRoutes);

/**
 * Health + Status Route
 */
app.get("/status", async (req, res) => {
  res.json({
    backend: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "configured" : "missing"
  });
});

// 4. Serve Frontend Static Files
const buildPath = path.join(__dirname, "client", "dist");
app.use(express.static(buildPath));

// 5. Handle Frontend Routing (CATCH-ALL)
// FIX: Express 5 requires wildcards to be named. 
// '{*path}' matches everything including the root.
app.get("{/*path}", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;