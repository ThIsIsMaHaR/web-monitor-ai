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
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"], 
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
const buildPath = path.resolve(__dirname, "client", "dist");
app.use(express.static(buildPath));

// 4. Handle Frontend Routing (CATCH-ALL)
// Using a Regex literal (/.*/) is the most robust way to avoid 
// "Missing parameter name" errors in Express 5.0.
app.get(/.*/, (req, res) => {
  // Guard: If the request looks like an API call but wasn't caught above, 
  // return 404 JSON instead of HTML to prevent the frontend .map() crash.
  if (req.path.startsWith("/links") || req.path.startsWith("/status")) {
    return res.status(404).json({ error: "API route not found" });
  }

  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
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