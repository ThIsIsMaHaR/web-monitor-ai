import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: String,
  tags: [String],
}, { timestamps: true });

export default mongoose.model("Link", LinkSchema);