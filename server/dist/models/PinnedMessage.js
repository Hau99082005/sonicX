"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pinnedMessageSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    message: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
        required: true,
    },
    pinnedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PinnedMessage", pinnedMessageSchema);
