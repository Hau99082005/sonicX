"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AmbientSoundSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    file: {
        type: Object,
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        required: true,
    },
    triggerContexts: {
        type: [String],
        enum: [
            "rain",
            "driving",
            "night",
            "studying",
            "working_out",
            "morning",
            "evening",
            "default",
        ],
        default: [],
    },
    triggerWeather: {
        type: [String],
        enum: ["rain", "storm", "clear", "cloudy", "snow", "fog", "default"],
        default: [],
    },
    triggerActivity: {
        type: [String],
        enum: [
            "studying",
            "driving",
            "working_out",
            "relaxing",
            "sleeping",
            "commuting",
            "default",
        ],
        default: [],
    },
    defaultGain: {
        type: Number,
        required: true,
        default: 0.3,
        min: 0,
        max: 1,
    },
    loop: {
        type: Boolean,
        default: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
AmbientSoundSchema.index({ triggerContexts: 1 });
AmbientSoundSchema.index({ triggerWeather: 1 });
AmbientSoundSchema.index({ isPublic: 1 });
const AmbientSound = mongoose_1.models.AmbientSound || (0, mongoose_1.model)("AmbientSound", AmbientSoundSchema);
exports.default = AmbientSound;
