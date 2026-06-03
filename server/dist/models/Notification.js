"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    type: {
        type: String,
        enum: ["message", "call", "friend_request", "group_invite"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    conversationId: {
        type: String,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
notificationSchema.index({ user: 1, createdAt: -1 });
exports.default = (0, mongoose_1.model)("Notification", notificationSchema);
