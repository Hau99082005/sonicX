"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const storySchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["image", "video", "text"],
        default: "image",
    },
    content: {
        type: String,
        required: true,
    },
    publicId: String,
    views: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            viewed_at: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.default = (0, mongoose_1.model)("Story", storySchema);
