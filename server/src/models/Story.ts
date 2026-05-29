import { Schema, model, Types, Document } from "mongoose";

export interface StoryView {
  user: Types.ObjectId;
  viewed_at: Date;
}

export interface StoryDocument extends Document {
  user: Types.ObjectId;
  type: "image" | "video" | "text";
  content: string; 
  publicId?: string;
  views: StoryView[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<StoryDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "text"],
      default: "image",
    },
    content: {
      type: String,
      required: true,
    },
    publicId: String,
    views: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        viewed_at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

export default model<StoryDocument>("Story", storySchema);
