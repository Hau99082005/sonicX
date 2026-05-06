import { Router } from "express";
import { mustAuth, isVerified } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { PlaylistValidationSchema } from "#/utils/validationSchema";
import { createPlaylist } from "#/controllers/playlist";

const router = Router();
router.post("/create", mustAuth, isVerified,validate(PlaylistValidationSchema), createPlaylist);

export default router;