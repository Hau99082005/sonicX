"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const refreshTokenSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.default = (0, mongoose_1.model)("RefreshToken", refreshTokenSchema);
