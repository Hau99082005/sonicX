"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ContextSnapshotSchema = new mongoose_1.Schema({
    weather: {
        type: String,
        enum: ["rain", "storm", "clear", "cloudy", "snow", "fog", "default"],
        required: true,
        default: "default",
    },
    activity: {
        type: String,
        enum: [
            "studying",
            "driving",
            "working_out",
            "relaxing",
            "sleeping",
            "commuting",
            "default",
        ],
        required: true,
        default: "default",
    },
    timeOfDay: {
        type: String,
        enum: ["morning", "afternoon", "evening", "night", "late_night"],
        required: true,
    },
    resolvedContexts: {
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
        required: true,
        default: ["default"],
    },
    capturedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, { _id: false });
const AppliedAdjustmentSchema = new mongoose_1.Schema({
    layerType: {
        type: String,
        enum: [
            "bass",
            "vocal",
            "ambient",
            "percussion",
            "melody",
            "lyrics_volume",
        ],
        required: true,
    },
    gainDelta: {
        type: Number,
        required: true,
    },
    fadeMs: {
        type: Number,
        required: true,
    },
    sourceContext: {
        type: String,
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
        required: true,
    },
}, { _id: false });
const DynamicMusicSessionSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    audio: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Audio",
        required: true,
    },
    profile: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "DynamicMusicProfile",
        required: true,
    },
    contextSnapshot: {
        type: ContextSnapshotSchema,
        required: true,
    },
    appliedAdjustments: {
        type: [AppliedAdjustmentSchema],
        required: true,
        default: [],
    },
    ambientSoundUrl: {
        type: String,
        required: false,
    },
    tempoMultiplier: {
        type: Number,
        required: true,
        default: 1.0,
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endedAt: {
        type: Date,
        required: false,
    },
}, { timestamps: true });
DynamicMusicSessionSchema.index({ owner: 1, startedAt: -1 });
DynamicMusicSessionSchema.index({ audio: 1, owner: 1 });
const DynamicMusicSession = mongoose_1.models.DynamicMusicSession ||
    (0, mongoose_1.model)("DynamicMusicSession", DynamicMusicSessionSchema);
exports.default = DynamicMusicSession;
