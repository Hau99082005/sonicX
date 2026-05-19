import { model, Model, models, Schema, Types } from "mongoose";

export type ContextType =
  | "rain"
  | "driving"
  | "night"
  | "studying"
  | "working_out"
  | "morning"
  | "evening"
  | "default";

export type ActivityType =
  | "studying"
  | "driving"
  | "working_out"
  | "relaxing"
  | "sleeping"
  | "commuting"
  | "default";

export type WeatherType =
  | "rain"
  | "storm"
  | "clear"
  | "cloudy"
  | "snow"
  | "fog"
  | "default";

export type TimeOfDayType =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";

export interface AudioLayerAdjustment {
  layerType:
    | "bass"
    | "vocal"
    | "ambient"
    | "percussion"
    | "melody"
    | "lyrics_volume";
  gainDelta: number;
  fadeMs: number;
}

export interface ContextRule {
  contextType: ContextType;
  priority: number;
  layerAdjustments: AudioLayerAdjustment[];
  ambientSoundUrl?: string;
  tempoMultiplier: number;
  description: string;
}

export interface DynamicMusicProfileDocument {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  isActive: boolean;
  contextRules: ContextRule[];
  createdAt: Date;
  updatedAt: Date;
}

const AudioLayerAdjustmentSchema = new Schema<AudioLayerAdjustment>(
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
  },
  { _id: false },
);

const ContextRuleSchema = new Schema<ContextRule>(
  {
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
  },
  { _id: false },
);

const DynamicMusicProfileSchema = new Schema<DynamicMusicProfileDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true },
);

DynamicMusicProfileSchema.index({ owner: 1, isActive: 1 });

const DynamicMusicProfile =
  models.DynamicMusicProfile ||
  model("DynamicMusicProfile", DynamicMusicProfileSchema);

export default DynamicMusicProfile as Model<DynamicMusicProfileDocument>;
