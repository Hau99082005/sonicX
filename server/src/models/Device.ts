import { Schema, model, Types, Document } from "mongoose";

export interface DeviceDocument extends Document {
  user: Types.ObjectId;
  deviceName?: string;
  platform: "android" | "ios" | "web" | "desktop";
  deviceToken?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<DeviceDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceName: String,
    platform: {
      type: String,
      enum: ["android", "ios", "web", "desktop"],
    },
    deviceToken: String,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default model<DeviceDocument>("Device", deviceSchema);
