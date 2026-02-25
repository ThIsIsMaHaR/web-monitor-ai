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

// DEBUG MIDDLEWARE: Log every request
app.use((req, res, next) => {
  console.log(`📡 DEBUG: ${req.method} request to ${req.url}`);
  next();
});

app.use("/links", linkRoutes);

const buildPath = path.join(__dirname, "client", "dist");
if (fs.existsSync(path.join(buildPath, "index.html"))) {
  app.use(express.static(buildPath));
  app.get("*splat", (req, res) => {
    if (req.path.startsWith("/links")) return res.status(404).json({ error: "API Route Not Found" });
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

export default app;