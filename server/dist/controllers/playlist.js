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
exports.createPlaylist = void 0;
const audio_1 = __importDefault(require("../models/audio"));
const playlist_1 = __importDefault(require("../models/playlist"));
const createPlaylist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, resId, visibility } = req.body;
    const ownerId = req.user.id;
    if (resId) {
        const audio = yield audio_1.default.findById(resId);
        if (!audio)
            return res.status(404).json({ error: "Could not found the audio!" });
    }
    const newPlaylist = new playlist_1.default({
        title,
        owner: ownerId,
        visibility
    });
    if (resId)
        newPlaylist.items = [resId];
    yield newPlaylist.save();
    res.status(201).json({
        playlist: {
            id: newPlaylist._id,
            title: newPlaylist.title,
            visibility: newPlaylist.visibility
        }
    });
});
exports.createPlaylist = createPlaylist;
