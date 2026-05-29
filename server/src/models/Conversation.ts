import { Schema, model, Types, Document } from "mongoose";

export interface ConversationMember {
  user: Types.ObjectId;
  role: "member" | "admin";
  is_muted: boolean;
  joined_at: Date;
}

export interface ConversationDocument extends Document {
  type: "private" | "group";
  name?: string;
  avatar?: { url: string; publicId: string };
  owner?: Types.ObjectId;
  members: ConversationMember[];
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: {
        url: String,
        publicId: String,
      },
      _id: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
        is_muted: {
          type: Boolean,
          default: false,
        },
        joined_at: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default model<ConversationDocument>("Conversation", conversationSchema);
