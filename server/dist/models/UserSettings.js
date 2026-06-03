"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSettingsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    notifications: {
        enabled: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
        vibration: { type: Boolean, default: true },
        preview: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        calls: { type: Boolean, default: true },
        friendRequests: { type: Boolean, default: true },
        groupInvites: { type: Boolean, default: true },
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("UserSettings", userSettingsSchema);
