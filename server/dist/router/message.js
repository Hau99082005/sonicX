"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const message_1 = require("../controllers/message");
const fileParser_1 = __importDefault(require("../middleware/fileParser"));
const router = (0, express_1.Router)();
router.post("/send", auth_1.mustAuth, fileParser_1.default, message_1.sendMessage);
router.get("/:conversationId", auth_1.mustAuth, message_1.getMessages);
router.patch("/seen/:messageId", auth_1.mustAuth, message_1.markAsSeen);
router.patch("/react/:messageId", auth_1.mustAuth, message_1.addReaction);
router.patch("/:id", auth_1.mustAuth, message_1.updateMessage);
router.delete("/:id", auth_1.mustAuth, message_1.deleteMessage);
exports.default = router;
