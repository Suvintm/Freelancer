import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  results: [
    {
      editorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      matchScore: Number,
      reason: String,
    },
  ],
});

const aiWorkspaceSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionType: { type: String, enum: ["chat", "guided"], default: "chat" },
    messages: [aiMessageSchema],
    guidedAnswers: {
       projectType: String,
       softwares: [String],
       vibe: [String],
       budget: String,
       deadline: String
    },
    lastResults: [
      {
        editorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        matchScore: Number,
        reason: String,
      },
    ],
    status: { type: String, enum: ["active", "completed"], default: "active" },
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const AIWorkspaceSession = mongoose.model("AIWorkspaceSession", aiWorkspaceSessionSchema);
export default AIWorkspaceSession;
