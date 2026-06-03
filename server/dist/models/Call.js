"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const callSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    caller: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["voice", "video"],
        default: "voice",
    },
    status: {
        type: String,
        enum: ["ringing", "accepted", "rejected", "missed", "ended"],
        default: "ringing",
    },
    participants: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            joined_at: Date,
            left_at: Date,
            _id: false,
        },
    ],
    startedAt: Date,
    endedAt: Date,
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Call", callSchema);
