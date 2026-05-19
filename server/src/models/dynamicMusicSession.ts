import { model, Model, models, Schema, Types } from "mongoose";
import {
  ActivityType,
  AudioLayerAdjustment,
  ContextType,
  TimeOfDayType,
  WeatherType,
} from "./dynamicMusicProfile";

export interface ContextSnapshot {
  weather: WeatherType;
  activity: ActivityType;
  timeOfDay: TimeOfDayType;
  resolvedContexts: ContextType[];
  capturedAt: Date;
}

export interface AppliedAdjustment {
  layerType: AudioLayerAdjustment["layerType"];
  gainDelta: number;
  fadeMs: number;
  sourceContext: ContextType;
}

export interface DynamicMusicSessionDocument {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  audio: Types.ObjectId;
  profile: Types.ObjectId;
  contextSnapshot: ContextSnapshot;
  appliedAdjustments: AppliedAdjustment[];
  ambientSoundUrl?: string;
  tempoMultiplier: number;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContextSnapshotSchema = new Schema<ContextSnapshot>(
  {
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
  },
  { _id: false },
);

const AppliedAdjustmentSchema = new Schema<AppliedAdjustment>(
  {
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
  },
  { _id: false },
);

const DynamicMusicSessionSchema = new Schema<DynamicMusicSessionDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    audio: {
      type: Schema.Types.ObjectId,
      ref: "Audio",
      required: true,
    },
    profile: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true },
);

DynamicMusicSessionSchema.index({ owner: 1, startedAt: -1 });
DynamicMusicSessionSchema.index({ audio: 1, owner: 1 });

const DynamicMusicSession =
  models.DynamicMusicSession ||
  model("DynamicMusicSession", DynamicMusicSessionSchema);

export default DynamicMusicSession as Model<DynamicMusicSessionDocument>;
