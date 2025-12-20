import mongoose from "mongoose";

const contentAccessLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  editorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["DRIVE_ACCESS_GRANTED"],
    default: "DRIVE_ACCESS_GRANTED",
  },
  agreementVersion: {
    type: String,
    default: "v1.0",
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ContentAccessLog = mongoose.model("ContentAccessLog", contentAccessLogSchema);
export default ContentAccessLog;
