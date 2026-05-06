import { Router } from "express";
import { mustAuth, isVerified } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { OldPlaylistValidationSchema, PlaylistValidationSchema } from "#/utils/validationSchema";
import { createPlaylist, getPlaylistByIdProfile, removePlaylist, updatePlaylist } from "#/controllers/playlist";
import { getAudio } from "#/controllers/audio";

const router = Router();
router.post("/create", mustAuth, isVerified,validate(PlaylistValidationSchema), createPlaylist);
router.patch("/", mustAuth, validate(OldPlaylistValidationSchema), updatePlaylist);
router.delete("/", mustAuth, removePlaylist);
router.get("/profile", mustAuth, getPlaylistByIdProfile);
router.get("/:playlistId", mustAuth, getAudio);

export default router;