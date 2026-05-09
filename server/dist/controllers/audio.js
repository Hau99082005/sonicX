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
exports.getLatestUploads = exports.deleteAudio = exports.getAudio = exports.updateAudio = exports.createAudio = void 0;
const cloud_1 = __importDefault(require("../cloud"));
const audio_1 = __importDefault(require("../models/audio"));
const mongoose_1 = require("mongoose");
const createAudio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { title, about, category } = req.body;
    const poster = (_a = req.files) === null || _a === void 0 ? void 0 : _a.poster;
    const audioFile = (_b = req.files) === null || _b === void 0 ? void 0 : _b.file;
    const ownerId = req.user.id;
    if (!audioFile)
        return res.status(422).json({ error: "Audio file is missing!" });
    const audioResult = yield cloud_1.default.uploader.upload(audioFile.filepath, {
        resource_type: "video"
    });
    const newAudio = new audio_1.default({
        title,
        about,
        category,
        owner: ownerId,
        file: {
            url: audioResult.url,
            publicId: audioResult.public_id,
        }
    });
    if (poster) {
        const posterResult = yield cloud_1.default.uploader.upload(poster.filepath, {
            width: 500,
            height: 500,
            crop: "thumb",
            gravity: "face"
        });
        newAudio.poster = { url: posterResult.secure_url, publicId: posterResult.public_id };
    }
    yield newAudio.save();
    res.status(201).json({
        audio: {
            title, about, file: newAudio.file.url,
            poster: (_c = newAudio.poster) === null || _c === void 0 ? void 0 : _c.url
        }
    });
});
exports.createAudio = createAudio;
const updateAudio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { title, about, category } = req.body;
    const poster = (_a = req.files) === null || _a === void 0 ? void 0 : _a.poster;
    const audioFile = (_b = req.files) === null || _b === void 0 ? void 0 : _b.file;
    const ownerId = new mongoose_1.Types.ObjectId(req.user.id);
    const audioId = new mongoose_1.Types.ObjectId(req.params.audioId);
    const audio = yield audio_1.default.findOneAndUpdate({ owner: ownerId, _id: audioId }, { title, about, category }, { new: true });
    if (!audio)
        return res.status(404).json({ error: 'Âm thanh không tồn tại hoặc không có quyền truy cập!' });
    if (audioFile) {
        if ((_c = audio.file) === null || _c === void 0 ? void 0 : _c.publicId) {
            yield cloud_1.default.uploader.destroy(audio.file.publicId, { resource_type: "video" });
        }
        const audioResult = yield cloud_1.default.uploader.upload(audioFile.filepath, {
            resource_type: "video"
        });
        audio.file = {
            url: audioResult.secure_url,
            publicId: audioResult.public_id
        };
        yield audio.save();
    }
    if (poster) {
        if ((_d = audio.poster) === null || _d === void 0 ? void 0 : _d.publicId) {
            yield cloud_1.default.uploader.destroy(audio.poster.publicId);
        }
        const posterResult = yield cloud_1.default.uploader.upload(poster.filepath, {
            width: 500,
            height: 500,
            crop: "thumb",
            gravity: "face"
        });
        audio.poster = {
            url: posterResult.secure_url,
            publicId: posterResult.public_id
        };
        yield audio.save();
    }
    res.status(200).json({
        audio: {
            title: audio.title,
            about: audio.about,
            category: audio.category,
            file: audio.file.url,
            poster: (_e = audio.poster) === null || _e === void 0 ? void 0 : _e.url
        }
    });
});
exports.updateAudio = updateAudio;
const getAudio = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const audio = yield audio_1.default.find({}).sort({ createdAt: -1 });
    res.status(200).json({ audio });
});
exports.getAudio = getAudio;
const deleteAudio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ownerId = new mongoose_1.Types.ObjectId(req.user.id);
    const audioId = new mongoose_1.Types.ObjectId(req.params.audioId);
    const audio = yield audio_1.default.findOneAndDelete({ owner: ownerId, _id: audioId });
    if (!audio)
        return res.status(404).json({ error: "Âm thanh không tồn tại hoặc không có quyền truy cập!" });
    if (audio.file.publicId) {
        yield cloud_1.default.uploader.destroy(audio.file.publicId, { resource_type: "video" });
    }
    if ((_a = audio.poster) === null || _a === void 0 ? void 0 : _a.publicId) {
        yield cloud_1.default.uploader.destroy(audio.poster.publicId);
    }
    res.status(200).json({ message: "Âm thanh đã được xóa thành công!", audioId });
});
exports.deleteAudio = deleteAudio;
const getLatestUploads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const list = yield audio_1.default.find().sort("-createdAt")
        .limit(10).populate("owner");
    const audios = list.map((item) => {
        var _a;
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            category: item.category,
            file: item.file.url,
            poster: (_a = item.poster) === null || _a === void 0 ? void 0 : _a.url,
            owner: {
                name: item.owner.name,
                id: item.owner._id
            }
        };
    });
    res.json({ audios });
});
exports.getLatestUploads = getLatestUploads;
