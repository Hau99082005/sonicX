import { Router } from "express";
import { mustAuth, isVerified } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { OldPlaylistValidationSchema, PlaylistValidationSchema } from "#/utils/validationSchema";
import { createPlaylist, updatePlaylist } from "#/controllers/playlist";

const router = Router();
router.post("/create", mustAuth, isVerified,validate(PlaylistValidationSchema), createPlaylist);
router.patch("/", mustAuth, validate(OldPlaylistValidationSchema), updatePlaylist);

export default router;