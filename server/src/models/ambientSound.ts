import { model, Model, models, Schema, Types } from "mongoose";
import { ContextType, WeatherType, ActivityType } from "./dynamicMusicProfile";

export interface AmbientSoundDocument {
  _id: Types.ObjectId;
  name: string;
  file: {
    url: string;
    publicId: string;
  };
  triggerContexts: ContextType[];
  triggerWeather: WeatherType[];
  triggerActivity: ActivityType[];
  defaultGain: number;
  loop: boolean;
  tags: string[];
  isPublic: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AmbientSoundSchema = new Schema<AmbientSoundDocument>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

AmbientSoundSchema.index({ triggerContexts: 1 });
AmbientSoundSchema.index({ triggerWeather: 1 });
AmbientSoundSchema.index({ isPublic: 1 });

const AmbientSound =
  models.AmbientSound || model("AmbientSound", AmbientSoundSchema);

export default AmbientSound as Model<AmbientSoundDocument>;
