import mongoose from "mongoose";

 const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: String, // Storing UUID from PostgreSQL
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "info", "success", "warning", "error",
                "chat_message",
                "order_status", "order_update", "payment_received", "payment_released",
                "delivery_submitted", "revision_requested",
                "follow", "follow_request", "follow_accept",
                "reel_like", "reel_comment",
                "job_application", "job_application_status", "job_hire"
            ],
            default: "info",
        },
        sender: {
            type: String, // Storing UUID from PostgreSQL
            default: null,
        },
        metaData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String, // Optional URL to redirect to
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for fetching unread notifications quickly
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
