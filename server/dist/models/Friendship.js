"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const friendshipSchema = new mongoose_1.Schema({
    requester: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "blocked"],
        default: "pending",
    },
    nickname: {
        type: String,
        default: null,
    },
}, { timestamps: true });
friendshipSchema.index({ requester: 1, receiver: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("Friendship", friendshipSchema);
