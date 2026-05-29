import { Schema, model, Types, Document } from "mongoose";

export interface CallParticipant {
  user: Types.ObjectId;
  joined_at?: Date;
  left_at?: Date;
}

export interface CallDocument extends Document {
  conversation: Types.ObjectId;
  caller: Types.ObjectId;
  type: "voice" | "video";
  status: "ringing" | "accepted" | "rejected" | "missed" | "ended";
  participants: CallParticipant[];
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<CallDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    caller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["voice", "video"],
      default: "voice",
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "missed", "ended"],
      default: "ringing",
    },
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        joined_at: Date,
        left_at: Date,
        _id: false,
      },
    ],
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

export default model<CallDocument>("Call", callSchema);
