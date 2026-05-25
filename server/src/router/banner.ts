import { Router } from "express";
import { 
  createBanner, 
  deleteBanner, 
  getBanners, 
  updateBanner 
} from "#/controllers/banner";
import { validate } from "#/middleware/validator";
import { BannerValidationSchema } from "#/utils/validationSchema";
import { mustAuth, isVerified, isAdmin } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post(
  "/create",
  mustAuth,
  isVerified,
  isAdmin,
  fileParser,
  validate(BannerValidationSchema),
  createBanner
);

router.patch(
  "/:id",
  mustAuth,
  isVerified,
  isAdmin,
  fileParser,
  validate(BannerValidationSchema),
  updateBanner
);

router.delete("/:id", mustAuth, isVerified, isAdmin, deleteBanner);

router.get("/list", getBanners);

export default router;
