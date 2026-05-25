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
exports.getDefaultRules = exports.deleteAmbientSound = exports.getAmbientSounds = exports.createAmbientSound = exports.getSessionHistory = exports.endSession = exports.resolveMix = exports.resetProfileToDefault = exports.deleteProfile = exports.updateProfile = exports.getProfileById = exports.getProfiles = exports.createProfile = void 0;
const mongoose_1 = require("mongoose");
const dynamicMusicProfile_1 = __importDefault(require("../models/dynamicMusicProfile"));
const dynamicMusicSession_1 = __importDefault(require("../models/dynamicMusicSession"));
const ambientSound_1 = __importDefault(require("../models/ambientSound"));
const cloud_1 = __importDefault(require("../cloud"));
const dynamicMusicEngine_1 = require("../utils/dynamicMusicEngine");
const createProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { name, contextRules } = req.body;
    const rules = contextRules !== null && contextRules !== void 0 ? contextRules : (0, dynamicMusicEngine_1.buildDefaultContextRules)();
    const profile = new dynamicMusicProfile_1.default({
        owner: ownerId,
        name: name !== null && name !== void 0 ? name : "My Dynamic Profile",
        contextRules: rules,
    });
    yield profile.save();
    res.status(201).json({ profile });
});
exports.createProfile = createProfile;
const getProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const profiles = yield dynamicMusicProfile_1.default.find({ owner: ownerId }).sort({
        createdAt: -1,
    });
    res.json({ profiles });
});
exports.getProfiles = getProfiles;
const getProfileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { profileId } = req.params;
    const profile = yield dynamicMusicProfile_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(profileId),
        owner: ownerId,
    });
    if (!profile)
        return res.status(404).json({ error: "Profile không tồn tại!" });
    res.json({ profile });
});
exports.getProfileById = getProfileById;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { profileId } = req.params;
    const { name, isActive, contextRules } = req.body;
    const profile = yield dynamicMusicProfile_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(profileId), owner: ownerId }, Object.assign(Object.assign(Object.assign({}, (name !== undefined && { name })), (isActive !== undefined && { isActive })), (contextRules !== undefined && { contextRules })), { new: true });
    if (!profile)
        return res.status(404).json({ error: "Profile không tồn tại!" });
    res.json({ profile });
});
exports.updateProfile = updateProfile;
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { profileId } = req.params;
    const profile = yield dynamicMusicProfile_1.default.findOneAndDelete({
        _id: new mongoose_1.Types.ObjectId(profileId),
        owner: ownerId,
    });
    if (!profile)
        return res.status(404).json({ error: "Profile không tồn tại!" });
    res.json({ message: "Profile đã được xóa!", profileId });
});
exports.deleteProfile = deleteProfile;
const resetProfileToDefault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { profileId } = req.params;
    const profile = yield dynamicMusicProfile_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(profileId), owner: ownerId }, { contextRules: (0, dynamicMusicEngine_1.buildDefaultContextRules)() }, { new: true });
    if (!profile)
        return res.status(404).json({ error: "Profile không tồn tại!" });
    res.json({ profile });
});
exports.resetProfileToDefault = resetProfileToDefault;
const resolveMix = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { profileId, audioId } = req.params;
    const { weather, activity, hour } = req.query;
    const profile = yield dynamicMusicProfile_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(profileId),
        owner: ownerId,
        isActive: true,
    });
    if (!profile)
        return res
            .status(404)
            .json({ error: "Profile không tồn tại hoặc không hoạt động!" });
    const contextInput = {
        weather: weather !== null && weather !== void 0 ? weather : "default",
        activity: activity !== null && activity !== void 0 ? activity : "default",
        hour: hour !== undefined ? parseInt(hour, 10) : new Date().getHours(),
    };
    const resolvedContexts = (0, dynamicMusicEngine_1.resolveContextsFromInput)(contextInput);
    const timeOfDay = (0, dynamicMusicEngine_1.resolveTimeOfDay)(contextInput.hour);
    const mix = (0, dynamicMusicEngine_1.computeMix)(profile.contextRules, resolvedContexts);
    const session = new dynamicMusicSession_1.default({
        owner: ownerId,
        audio: new mongoose_1.Types.ObjectId(audioId),
        profile: profile._id,
        contextSnapshot: {
            weather: contextInput.weather,
            activity: contextInput.activity,
            timeOfDay,
            resolvedContexts,
            capturedAt: new Date(),
        },
        appliedAdjustments: mix.appliedAdjustments,
        ambientSoundUrl: mix.ambientSoundUrl,
        tempoMultiplier: mix.tempoMultiplier,
        startedAt: new Date(),
    });
    yield session.save();
    res.json({
        sessionId: session._id,
        resolvedContexts,
        timeOfDay,
        appliedAdjustments: mix.appliedAdjustments,
        ambientSoundUrl: mix.ambientSoundUrl,
        tempoMultiplier: mix.tempoMultiplier,
    });
});
exports.resolveMix = resolveMix;
const endSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { sessionId } = req.params;
    const session = yield dynamicMusicSession_1.default.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(sessionId),
        owner: ownerId,
        endedAt: { $exists: false },
    }, { endedAt: new Date() }, { new: true });
    if (!session)
        return res
            .status(404)
            .json({ error: "Session không tồn tại hoặc đã kết thúc!" });
    res.json({ message: "Session đã kết thúc!", session });
});
exports.endSession = endSession;
const getSessionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const ownerId = req.user.id;
    const limit = parseInt((_a = req.query.limit) !== null && _a !== void 0 ? _a : "20", 10);
    const page = parseInt((_b = req.query.page) !== null && _b !== void 0 ? _b : "1", 10);
    const sessions = yield dynamicMusicSession_1.default.find({ owner: ownerId })
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("audio", "title poster file")
        .populate("profile", "name");
    const total = yield dynamicMusicSession_1.default.countDocuments({ owner: ownerId });
    res.json({ sessions, total, page, limit });
});
exports.getSessionHistory = getSessionHistory;
const createAmbientSound = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const ownerId = req.user.id;
    const audioFile = (_a = req.files) === null || _a === void 0 ? void 0 : _a.file;
    if (!audioFile)
        return res.status(422).json({ error: "File âm thanh bị thiếu!" });
    const { name, triggerContexts, triggerWeather, triggerActivity, defaultGain, loop, tags, isPublic, } = req.body;
    const result = yield cloud_1.default.uploader.upload(audioFile.filepath, {
        resource_type: "video",
        folder: "ambient_sounds",
    });
    const ambient = new ambientSound_1.default({
        name,
        file: { url: result.secure_url, publicId: result.public_id },
        triggerContexts: triggerContexts ? JSON.parse(triggerContexts) : [],
        triggerWeather: triggerWeather ? JSON.parse(triggerWeather) : [],
        triggerActivity: triggerActivity ? JSON.parse(triggerActivity) : [],
        defaultGain: defaultGain ? parseFloat(defaultGain) : 0.3,
        loop: loop !== undefined ? loop === "true" : true,
        tags: tags ? JSON.parse(tags) : [],
        isPublic: isPublic !== undefined ? isPublic === "true" : true,
        owner: ownerId,
    });
    yield ambient.save();
    res.status(201).json({ ambient });
});
exports.createAmbientSound = createAmbientSound;
const getAmbientSounds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { context, weather, activity } = req.query;
    const filter = { isPublic: true };
    if (context)
        filter.triggerContexts = context;
    if (weather)
        filter.triggerWeather = weather;
    if (activity)
        filter.triggerActivity = activity;
    const sounds = yield ambientSound_1.default.find(filter).sort({ createdAt: -1 });
    res.json({ sounds });
});
exports.getAmbientSounds = getAmbientSounds;
const deleteAmbientSound = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = req.user.id;
    const { soundId } = req.params;
    const sound = yield ambientSound_1.default.findOneAndDelete({
        _id: new mongoose_1.Types.ObjectId(soundId),
        owner: ownerId,
    });
    if (!sound)
        return res.status(404).json({ error: "Âm thanh không tồn tại!" });
    yield cloud_1.default.uploader.destroy(sound.file.publicId, {
        resource_type: "video",
    });
    res.json({ message: "Âm thanh môi trường đã được xóa!", soundId });
});
exports.deleteAmbientSound = deleteAmbientSound;
const getDefaultRules = (_req, res) => {
    res.json({ contextRules: (0, dynamicMusicEngine_1.buildDefaultContextRules)() });
};
exports.getDefaultRules = getDefaultRules;
