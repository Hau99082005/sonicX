import { Schema, model, Types, Document } from "mongoose";

export interface MessageReaction {
  user: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface MessageSeen {
  user: Types.ObjectId;
  seen_at: Date;
}

export interface MessageDocument extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  replyTo?: Types.ObjectId;
  type: "text" | "image" | "video" | "audio" | "file" | "call" | "system";
  message?: string;
  media?: {
    url: string;
    public_id?: string;
    mime_type?: string;
    file_size?: number;
    duration?: number;
    width?: number;
    height?: number;
  }[];
  reactions: MessageReaction[];
  seenBy: MessageSeen[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "call", "system"],
      default: "text",
    },
    message: {
      type: String,
      trim: true,
    },
    media: [
      {
        url: { type: String, required: true },
        public_id: String,
        mime_type: String,
        file_size: Number,
        duration: Number,
        width: Number,
        height: Number,
        _id: false,
      },
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    seenBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        seen_at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
messageSchema.index({ conversation: 1, createdAt: -1 });

export default model<MessageDocument>("Message", messageSchema);
