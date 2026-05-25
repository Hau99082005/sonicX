import { Schema, Types } from "mongoose";
import { model, models, Model } from "mongoose";

interface BannerDocument {
  banner: { url: string; publicId: string };
  title: string;
}

const bannerSchema = new Schema<BannerDocument>(
  {
    banner: {
      type: Object,
      url: String,
      publicId: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Banner = models.Banner || model("Banner", bannerSchema);
export default Banner as Model<BannerDocument>;
