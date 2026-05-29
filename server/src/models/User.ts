import { compare, hash } from "bcryptjs";
import { Document, Model, model, Schema, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  firebase_uid?: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  login_type: "email" | "google";
  avatar?: { url: string; publicId: string };
  cover_image?: { url: string; publicId: string };
  bio?: string;
  is_online: boolean;
  last_seen?: Date;
  verified: boolean;
  role: "user" | "admin";
  phone?: string;
  phoneVerified?: boolean;
  token: string[];
}

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, {}, Methods>(
  {
    firebase_uid: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    login_type: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    avatar: {
      type: {
        url: String,
        publicId: String,
      },
      _id: false,
    },
    cover_image: {
      type: {
        url: String,
        publicId: String,
      },
      _id: false,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    is_online: {
      type: Boolean,
      default: false,
    },
    last_seen: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    token: [String],
  },
  { timestamps: true },
);

userSchema.pre("save", async function (this: UserDocument) {
  if (this.isModified("password") && this.password) {
    this.password = await hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (
  this: UserDocument,
  password,
) {
  if (!this.password) return false;
  return await compare(password, this.password);
};

export default model("User", userSchema) as Model<UserDocument, {}, Methods>;
