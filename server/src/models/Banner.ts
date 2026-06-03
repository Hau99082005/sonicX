import mongoose, { Schema } from "mongoose";


interface IBanner {
    title: string;
    image: string;
}

const BannerSchema = new Schema<IBanner>({
    title: {
        type: String,
        required: true,
        default: "",
    },
    image: {
        type: String,
        required: true,
        default: "",
    }
});

const Banner = mongoose.model<IBanner>("Banner", BannerSchema);
export default Banner;