import { Schema, model, Types, Document } from "mongoose";

export interface PinnedMessageDocument extends Document {
  conversation: Types.ObjectId;
  message: Types.ObjectId;
  pinnedBy: Types.ObjectId;
  createdAt: Date;
}

const pinnedMessageSchema = new Schema<PinnedMessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<PinnedMessageDocument>("PinnedMessage", pinnedMessageSchema);
