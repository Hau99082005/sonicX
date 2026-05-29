import { Schema, model, Types, Document } from "mongoose";

export interface FriendshipDocument extends Document {
  requester: Types.ObjectId;
  receiver: Types.ObjectId;
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<FriendshipDocument>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

friendshipSchema.index({ requester: 1, receiver: 1 }, { unique: true });

export default model<FriendshipDocument>("Friendship", friendshipSchema);
