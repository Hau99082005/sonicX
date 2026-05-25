import { RequestHandler, Response } from "express";
import Banner from "#/models/Banner";
import { BannerRequest } from "#/@types/banner";
import cloudinary from "#/cloud";

export const createBanner: RequestHandler = async (
  req: BannerRequest,
  res: Response,
) => {
  const { title } = req.body;
  const bannerFile = req.files?.banner;

  if (!bannerFile)
    return res.status(422).json({ error: "Banner image is missing!" });

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    bannerFile.filepath,
    {
      width: 1280,
      height: 720,
      crop: "fill",
    },
  );

  const banner = new Banner({
    title,
    banner: { url: secure_url, publicId: public_id },
  });

  await banner.save();

  if (banner) {
    return res.status(201).json({ banner });
  } else {
    return res.status(500).json({ error: "Failed to create banner!" });
  }
};

export const updateBanner: RequestHandler = async (
  req: BannerRequest,
  res: Response,
) => {
  const { title } = req.body;
  const { id } = req.params;
  const bannerFile = req.files?.banner;

  const banner = await Banner.findById(id);
  if (!banner) return res.status(404).json({ error: "Banner not found!" });

  if (title) banner.title = title;

  if (bannerFile) {
    if (banner.banner?.publicId) {
      await cloudinary.uploader.destroy(banner.banner.publicId);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      bannerFile.filepath,
      {
        width: 1280,
        height: 720,
        crop: "fill",
      },
    );

    banner.banner = { url: secure_url, publicId: public_id };
  }

  await banner.save();
  if (banner) {
    return res.status(200).json({ banner });
  } else {
    return res.status(500).json({ error: "Failed to update banner!" });
  }
};

export const deleteBanner: RequestHandler = async (req, res: Response) => {
  const { id } = req.params;

  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) return res.status(404).json({ error: "Banner not found!" });

  if (banner.banner?.publicId) {
    await cloudinary.uploader.destroy(banner.banner.publicId);
  }

  res.json({ message: "Banner deleted successfully!" });
};

export const getBanners: RequestHandler = async (req, res: Response) => {
  const banners = await Banner.find().sort("-createdAt");
  res.json({ banners });
};
