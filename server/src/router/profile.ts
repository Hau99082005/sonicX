import { isAuth, mustAuth } from "#/middleware/auth";
import { Router } from "express";
import { updateProfile, sendProfile, getUser } from "#/controllers/user";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.get("/is-auth", mustAuth, sendProfile);
router.patch("/update", mustAuth, fileParser, updateProfile);
router.get("/info/:userId", isAuth, getUser);

export default router;
