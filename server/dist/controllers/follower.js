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
exports.getPublicUploads = exports.getUploads = exports.updatedFollower = void 0;
const audio_1 = __importDefault(require("../models/audio"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
const updatedFollower = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { profileId } = req.params;
    let status;
    if (!(0, mongoose_1.isValidObjectId)(profileId))
        return res.status(422).json({ error: "Invalid profile id!" });
    const profile = yield User_1.default.findById(profileId);
    if (!profile)
        return res.status(404).json({ error: "Profile not found!" });
    const alreadyFollower = profile.followers.some((id) => id.toString() === req.user.id);
    if (alreadyFollower) {
        yield User_1.default.findByIdAndUpdate(profileId, { $pull: { followers: req.user.id } });
        status = "removed";
    }
    else {
        yield User_1.default.findByIdAndUpdate(profileId, { $addToSet: { followers: req.user.id } });
        status = "added";
    }
    res.status(200).json({ status });
});
exports.updatedFollower = updatedFollower;
const getUploads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = "80", pageNo = "0" } = req.query;
    const data = yield audio_1.default.find({ owner: req.user.id })
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt");
    const audios = data.map(item => {
        var _a;
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            poster: (_a = item.poster) === null || _a === void 0 ? void 0 : _a.url,
            date: item.createdAt,
            owner: { name: req.user.name, id: req.user.id }
        };
    });
    res.json({ audios });
});
exports.getUploads = getUploads;
const getPublicUploads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = "80", pageNo = "0" } = req.query;
    const { profileId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(profileId))
        return res.status(422).json({ error: "Invalid profile Id!" });
    const data = yield audio_1.default.find({ owner: profileId })
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")
        .populate("owner");
    const audios = data.map(item => {
        var _a;
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            poster: (_a = item.poster) === null || _a === void 0 ? void 0 : _a.url,
            date: item.createdAt,
            owner: { name: item.owner.name, id: item.owner._id }
        };
    });
    res.json({ audios });
});
exports.getPublicUploads = getPublicUploads;
