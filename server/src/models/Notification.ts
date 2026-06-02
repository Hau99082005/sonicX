import { Schema, model, Types, Document } from "mongoose";

export interface NotificationDocument extends Document {
  user: Types.ObjectId;
  sender?: Types.ObjectId;
  type: "message" | "call" | "friend_request" | "group_invite";
  content: string;
  conversationId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["message", "call", "friend_request", "group_invite"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    conversationId: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default model<NotificationDocument>("Notification", notificationSchema);
