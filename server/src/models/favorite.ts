import { Model, model, models, Schema, Types } from "mongoose";

interface FavoriteDocument {
    owner: Types.ObjectId | string;
    items: Types.ObjectId[];
}

const favoriteSchema = new Schema<FavoriteDocument>({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: "Audio",
    }]
}, { timestamps: true });

const Favorite = models.Favorite || model("Favorite", favoriteSchema);
export default Favorite as Model<FavoriteDocument>;