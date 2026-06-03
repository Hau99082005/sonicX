"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStory = exports.getStories = exports.createStory = void 0;
const Story_1 = __importDefault(require("../models/Story"));
const cloud_1 = __importDefault(require("../cloud"));
const mongoose_1 = require("mongoose");
const createStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { type } = req.body;
    const file = (_a = req.files) === null || _a === void 0 ? void 0 : _a.content;
    const userId = req.user.id;
    const validTypes = ["image", "video", "text"];
    if (type && !validTypes.includes(type)) {
        type = file ? "image" : "text";
    }
    if (!type) {
        type = file ? "image" : "text";
    }
    if (type !== "text" && !file) {
        return res.status(422).json({ error: "File is required for image/video story!" });
    }
    let content = req.body.content;
    let publicId;
    if (type !== "text" && file) {
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(file.filepath, { resource_type: "auto" });
        content = secure_url;
        publicId = public_id;
    }
    const story = yield Story_1.default.create({
        user: userId,
        type: type || "image",
        content,
        publicId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ story });
});
exports.createStory = createStory;
const getStories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const stories = yield Story_1.default.find({
        expiresAt: { $gt: new Date() },
    })
        .populate("user", "username avatar")
        .sort({ createdAt: -1 });
    res.status(200).json({ stories });
});
exports.getStories = getStories;
const deleteStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid story ID!" });
    const story = yield Story_1.default.findOne({ _id: id, user: userId });
    if (!story)
        return res.status(404).json({ error: "Story not found!" });
    if (story.publicId) {
        yield cloud_1.default.uploader.destroy(story.publicId);
    }
    yield Story_1.default.findByIdAndDelete(id);
    res.status(200).json({ message: "Story deleted!" });
});
exports.deleteStory = deleteStory;
