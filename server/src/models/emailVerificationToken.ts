import { Model, model, ObjectId, Schema } from "mongoose";


interface EmailVerificationTokenDocument {
    owner: ObjectId;
    token: string;
    createdAt: Date;
}

//Hết hạn sau 1 giờ

const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            expires: 3600, //60 min * 60 sec = 3600s
            default: Date.now()
        }
    }
);

export default model("EmailVerificationToken", emailVerificationTokenSchema) as Model<EmailVerificationTokenDocument>;


