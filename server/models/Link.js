import mongoose from "mongoose";

const linkSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, { 
  // This is crucial for fixing the "Invalid Date" issue
  timestamps: true 
});

export default mongoose.model("Link", linkSchema);