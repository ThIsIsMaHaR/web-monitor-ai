import mongoose from "mongoose";

const CheckSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Link",
    required: true
  },
  contentSnapshot: String,
  diff: String,
  summary: String
}, { timestamps: true });

export default mongoose.model("CheckHistory", CheckSchema);