import { Model, model, Schema, Types } from "mongoose";
import { hash, compare } from "bcryptjs";

interface PhoneVerificationTokenDocument {
  owner: Types.ObjectId | string;
  token: string;
  phone: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

// Hết hạn sau 10 phút
const phoneVerificationTokenSchema = new Schema<
  PhoneVerificationTokenDocument,
  {},
  Methods
>({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 600, // 10 min * 60 sec = 600s
    default: Date.now,
  },
});

phoneVerificationTokenSchema.pre("save", async function () {
  if (this.isModified("token")) {
    this.token = await hash(this.token, 10);
  }
});

phoneVerificationTokenSchema.methods.compareToken = async function (token) {
  const result = await compare(token, this.token);
  return result;
};

export default model(
  "PhoneVerificationToken",
  phoneVerificationTokenSchema,
) as Model<PhoneVerificationTokenDocument, {}, Methods>;
