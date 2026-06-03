import Banner from "#/models/Banner";
import { RequestHandler } from "express";
import { RequestWithFiles } from "#/middleware/fileParser";

export const getBanners: RequestHandler = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    return res.status(200).json(banners);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createBanners: RequestHandler = async (
  req: RequestWithFiles,
  res,
) => {
  try {
    const title = req.body?.title || req.body?.titile;
    const imageFile = req.files?.image;
    const image = imageFile?.originalFilename || imageFile?.newFilename;

    if (!title || !image) {
      return res.status(400).json({
        message: "Title and Image are required!",
        debug: {
          title,
          hasImage: !!imageFile,
          image,
          body: req.body,
          files: Object.keys(req.files || {}),
        },
      });
    }

    const newBanner = new Banner({ title, image });
    await newBanner.save();
    return res.status(201).json(newBanner);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

export const updateBanners: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Banner ID is required!" });
    }
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true },
    );
    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found!" });
    } else {
      return res.status(200).json(updatedBanner);
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

export const deleteBanners: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Banner ID is required!" });
    }
    const deletedBanner = await Banner.findByIdAndDelete(id);
    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found!" });
    } else {
      return res.status(200).json({ message: "Banner deleted successfully!" });
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

export const getBannerById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Banner ID is required!" });
    }
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found!" });
    } else {
      return res.status(200).json(banner);
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};
