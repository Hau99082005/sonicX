import { updatedFollower } from "#/controllers/follower";
import { mustAuth } from "#/middleware/auth";
import { Router } from "express";


const router = Router();
router.post("/update-follower/:profileId", mustAuth, updatedFollower);

export default router;