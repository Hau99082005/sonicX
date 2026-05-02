import { Model, model, Schema, Types } from "mongoose";
import { hash, compare } from "bcryptjs";


interface PasswordResetTokenDocument {
    owner: Types.ObjectId | string;
    token: string;
    createdAt: Date;
}

interface Methods {
    compareToken(token: string): Promise<boolean>
}

//Hết hạn sau 1 giờ

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument, {}, Methods>(
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

passwordResetTokenSchema.pre('save', async function () {
    if (this.isModified('token')) {
        this.token = await hash(this.token, 10);
    }
});


passwordResetTokenSchema.methods.compareToken = async function (token) {
    const result = await compare(token, this.token)
    return result;
}


export default model("PasswordResetToken", passwordResetTokenSchema) as Model<PasswordResetTokenDocument, {}, Methods>;


