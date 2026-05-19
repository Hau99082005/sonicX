import { Router } from "express";
import { mustAuth, isVerified } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";
import {
  createProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  resetProfileToDefault,
  resolveMix,
  endSession,
  getSessionHistory,
  createAmbientSound,
  getAmbientSounds,
  deleteAmbientSound,
  getDefaultRules,
} from "#/controllers/dynamicMusic";

const router = Router();

router.get("/rules/default", getDefaultRules);

router.post("/profiles", mustAuth, isVerified, createProfile);
router.get("/profiles", mustAuth, getProfiles);
router.get("/profiles/:profileId", mustAuth, getProfileById);
router.patch("/profiles/:profileId", mustAuth, isVerified, updateProfile);
router.delete("/profiles/:profileId", mustAuth, isVerified, deleteProfile);
router.post(
  "/profiles/:profileId/reset",
  mustAuth,
  isVerified,
  resetProfileToDefault,
);

router.get("/profiles/:profileId/resolve/:audioId", mustAuth, resolveMix);

router.patch("/sessions/:sessionId/end", mustAuth, endSession);
router.get("/sessions", mustAuth, getSessionHistory);

router.post("/ambient", mustAuth, isVerified, fileParser, createAmbientSound);
router.get("/ambient", mustAuth, getAmbientSounds);
router.delete("/ambient/:soundId", mustAuth, isVerified, deleteAmbientSound);

export default router;
