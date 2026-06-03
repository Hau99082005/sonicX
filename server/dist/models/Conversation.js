"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["private", "group"],
        default: "private",
    },
    name: {
        type: String,
        trim: true,
    },
    avatar: {
        type: {
            url: String,
            publicId: String,
        },
        _id: false,
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    members: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            role: {
                type: String,
                enum: ["member", "admin"],
                default: "member",
            },
            is_muted: {
                type: Boolean,
                default: false,
            },
            joined_at: {
                type: Date,
                default: Date.now,
            },
            _id: false,
        },
    ],
    banned: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Conversation", conversationSchema);
