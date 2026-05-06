import { getPublicProfile, getPublicUploads, getUploads, updatedFollower } from "#/controllers/follower";
import { mustAuth } from "#/middleware/auth";
import { Router } from "express";


const router = Router();
router.post("/update-follower/:profileId", mustAuth, updatedFollower);
router.get('/uploads', mustAuth, getUploads);
router.get("/uploads/:profileId", getPublicUploads);
router.get("/info/:profileId", getPublicProfile);

export default router;