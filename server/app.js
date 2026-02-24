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

// 1. Security Middleware (Fixes Google Font & CSP Errors)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"], // Allows frontend to talk to your API
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
 * Required by assignment
 */
app.get("/status", async (req, res) => {
  res.json({
    backend: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    llm: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "configured" : "missing"
  });
});

// 4. Serve Frontend Static Files (from Vite build)
// This tells Express to look into server/client/dist
app.use(express.static(path.join(__dirname, "client", "dist")));

// 5. Handle Frontend Routing
// If a user hits a route not defined above, send them to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;