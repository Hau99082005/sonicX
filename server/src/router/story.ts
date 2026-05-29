import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import { createStory, deleteStory, getStories } from "#/controllers/story";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/create", mustAuth, fileParser, createStory);
router.get("/all", mustAuth, getStories);
router.delete("/:id", mustAuth, deleteStory);

export default router;
