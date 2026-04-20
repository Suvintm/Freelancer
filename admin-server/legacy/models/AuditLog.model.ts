import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAuditLog extends Document {
    adminId: string;
    email: string;
    action: string;
    module: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    timestamp: Date;
}

const auditLogSchema: Schema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
