import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
  updateConversation,
} from "#/controllers/conversation";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/create", mustAuth, fileParser, createConversation);
router.get("/all", mustAuth, getConversations);
router.get("/:id", mustAuth, getConversationById);
router.patch("/:id", mustAuth, fileParser, updateConversation);
router.delete("/:id", mustAuth, deleteConversation);

export default router;
