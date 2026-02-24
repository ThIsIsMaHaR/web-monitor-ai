import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import linkRoutes from "./routes/linkRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
    llm: process.env.OPENAI_API_KEY ? "configured" : "missing"
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

export default app;