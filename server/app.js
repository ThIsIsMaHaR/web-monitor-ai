import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import linkRoutes from "./routes/linkRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. SECURITY MIDDLEWARE (Updated to be less restrictive)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true, 
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
      },
    },
  })
);

app.use(cors());
app.use(express.json());

// 2. ROUTES
app.use("/links", linkRoutes);

app.get("/status", (req, res) => {
  res.json({
    backend: "ok",
    llm: process.env.GEMINI_API_KEY ? "configured" : "missing"
  });
});

// 3. STATIC FILES
const buildPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

// 4. CATCH-ALL (EXPRESS 5 COMPLIANT)
app.get("/*path", (req, res) => {
  if (req.path.startsWith("/links")) return res.status(404).json({ error: "API not found" });
  
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) res.status(500).send("Build files missing. Run npm run build.");
  });
});

// DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

export default app;