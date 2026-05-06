import { compare, hash } from "bcryptjs";
import { Model, model, Schema, Types } from "mongoose";

export interface UserDocument {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    verified: boolean;
    avatar?: { url: string; publicId: string };
    token: string[];
    favorites: Types.ObjectId[];
    followers: Types.ObjectId[];
    followings: Types.ObjectId[];
}

interface Methods {
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, {}, Methods>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: Object,
        url: String,
        publicId: String,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: "Audio"
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    followings: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    token: [String]
}, { timestamps: true});

userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await hash(this.password, 10);
    }
});


userSchema.methods.comparePassword = async function (password) {
    const result = await compare(password, this.password);
    return result;
}

export default model("User", userSchema) as Model<UserDocument, {}, Methods>;


