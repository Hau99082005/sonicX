"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const story_1 = require("../controllers/story");
const fileParser_1 = __importDefault(require("../middleware/fileParser"));
const router = (0, express_1.Router)();
router.post("/create", auth_1.mustAuth, fileParser_1.default, story_1.createStory);
router.get("/all", auth_1.mustAuth, story_1.getStories);
router.delete("/:id", auth_1.mustAuth, story_1.deleteStory);
exports.default = router;
