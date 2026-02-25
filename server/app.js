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

app.use(helmet({ contentSecurityPolicy: false })); 
app.use(cors());
app.use(express.json());

// 1. API ROUTES FIRST
app.use("/links", linkRoutes);

// 2. FRONTEND SERVING
const buildPath = path.join(__dirname, "client", "dist");

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  app.use(express.static(buildPath));
  
  // EXPRESS 5 FIX: Wildcards must be named.
  app.get("*splat", (req, res) => {
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;