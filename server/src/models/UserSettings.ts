import { Schema, model, Types, Document } from "mongoose";

export interface UserSettingsDocument extends Document {
  user: Types.ObjectId;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    preview: boolean;
    messages: boolean;
    calls: boolean;
    friendRequests: boolean;
    groupInvites: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<UserSettingsDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true },
);

export default model<UserSettingsDocument>("UserSettings", userSettingsSchema);
