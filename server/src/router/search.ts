import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import { search } from "#/controllers/search";

const router = Router();

router.get("/", mustAuth, search);

export default router;
