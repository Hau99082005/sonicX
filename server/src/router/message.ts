import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  addReaction,
  deleteMessage,
  getMessages,
  markAsSeen,
  sendMessage,
  updateMessage,
} from "#/controllers/message";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/send", mustAuth, fileParser, sendMessage);
router.get("/:conversationId", mustAuth, getMessages);
router.patch("/seen/:messageId", mustAuth, markAsSeen);
router.patch("/react/:messageId", mustAuth, addReaction);
router.patch("/:id", mustAuth, updateMessage);
router.delete("/:id", mustAuth, deleteMessage);

export default router;
