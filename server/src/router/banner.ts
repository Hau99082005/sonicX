import {
  createBanners,
  deleteBanners,
  getBannerById,
  getBanners,
  updateBanners,
} from "#/controllers/banner";
import { mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";
import { Router } from "express";

const router = Router();
router.get("/banners", mustAuth, getBanners);
router.get("/banners/:id", mustAuth, getBannerById);
router.post("/banners", mustAuth, fileParser, createBanners);
router.put("/banners/:id", mustAuth, fileParser, updateBanners);
router.delete("/banners/:id", mustAuth, deleteBanners);

export default router;
