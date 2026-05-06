import { model, Model, models, Schema, Types } from "mongoose";
import { categories, CategoriesType } from "./audio_category";

export interface AudioDocument<T = Types.ObjectId> {
    _id: Types.ObjectId;
    title: string;
    about: string;
    owner: T;
    file: {
        url: string;
        publicId: string;
    }
    poster?: {
        url: string;
        publicId: string;
    }
    likes: Types.ObjectId[];
    category: CategoriesType;
    createdAt: Date,
}

const AudioSchema = new Schema<AudioDocument>({
    title: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    file: {
        type: Object,
        url: String,
        publicId: String,
        required: true
    },
    poster: {
        type: Object,
        url: String,
        publicId: String,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    category: {
        type: String,
        enum: categories,
        default: "Others"
    }
}, { timestamps: true });

const Audio = models.Audio || model("Audio", AudioSchema);
export default Audio as Model<AudioDocument>;
