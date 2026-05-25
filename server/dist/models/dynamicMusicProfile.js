"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AudioLayerAdjustmentSchema = new mongoose_1.Schema({
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
        min: -20,
        max: 20,
    },
    fadeMs: {
        type: Number,
        required: true,
        default: 500,
        min: 0,
        max: 10000,
    },
}, { _id: false });
const ContextRuleSchema = new mongoose_1.Schema({
    contextType: {
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
    priority: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
    },
    layerAdjustments: {
        type: [AudioLayerAdjustmentSchema],
        required: true,
    },
    ambientSoundUrl: {
        type: String,
        required: false,
    },
    tempoMultiplier: {
        type: Number,
        required: true,
        default: 1.0,
        min: 0.5,
        max: 2.0,
    },
    description: {
        type: String,
        required: true,
    },
}, { _id: false });
const DynamicMusicProfileSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    contextRules: {
        type: [ContextRuleSchema],
        required: true,
        default: [],
    },
}, { timestamps: true });
DynamicMusicProfileSchema.index({ owner: 1, isActive: 1 });
const DynamicMusicProfile = mongoose_1.models.DynamicMusicProfile ||
    (0, mongoose_1.model)("DynamicMusicProfile", DynamicMusicProfileSchema);
exports.default = DynamicMusicProfile;
