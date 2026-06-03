"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
    },
    type: {
        type: String,
        enum: ["text", "image", "video", "audio", "file", "call", "system", "sticker", "gif", "markdown", "code", "like"],
        default: "text",
    },
    message: {
        type: String,
        trim: true,
    },
    meta: {
        size: Number,
        duration: String,
        callType: String,
        missed: Boolean,
    },
    media: [
        {
            url: { type: String, required: true },
            public_id: String,
            mime_type: String,
            file_size: Number,
            duration: Number,
            width: Number,
            height: Number,
            _id: false,
        },
    ],
    reactions: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    seenBy: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            seen_at: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    isEdited: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
messageSchema.index({ conversation: 1, createdAt: -1 });
exports.default = (0, mongoose_1.model)("Message", messageSchema);
