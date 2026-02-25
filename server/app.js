import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import linkRoutes from "./routes/linkRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// 1. MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// 2. API ROUTES (Must come before static files)
app.use("/links", linkRoutes);

// 3. FRONTEND SERVING
const buildPath = path.join(__dirname, "client", "dist");

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  app.use(express.static(buildPath));
  
  // Standard catch-all for React Router
  app.get("*", (req, res) => {
    // If it's a call to /links that reached here, it's a 404
    if (req.path.startsWith("/links")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Backend is live. Frontend build not found.");
  });
}

// 4. DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;