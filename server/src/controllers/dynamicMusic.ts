import { RequestHandler } from "express";
import { Types } from "mongoose";
import DynamicMusicProfile from "#/models/dynamicMusicProfile";
import DynamicMusicSession from "#/models/dynamicMusicSession";
import AmbientSound from "#/models/ambientSound";
import { RequestWithFiles } from "#/middleware/fileParser";
import cloudinary from "#/cloud";
import formidable from "formidable";
import {
  buildDefaultContextRules,
  computeMix,
  resolveContextsFromInput,
  resolveTimeOfDay,
  ContextInput,
} from "#/utils/dynamicMusicEngine";
import { ActivityType, WeatherType } from "#/models/dynamicMusicProfile";

export const createProfile: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { name, contextRules } = req.body;

  const rules = contextRules ?? buildDefaultContextRules();

  const profile = new DynamicMusicProfile({
    owner: ownerId,
    name: name ?? "My Dynamic Profile",
    contextRules: rules,
  });

  await profile.save();
  res.status(201).json({ profile });
};

export const getProfiles: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const profiles = await DynamicMusicProfile.find({ owner: ownerId }).sort({
    createdAt: -1,
  });
  res.json({ profiles });
};

export const getProfileById: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { profileId } = req.params;

  const profile = await DynamicMusicProfile.findOne({
    _id: new Types.ObjectId(profileId as any),
    owner: ownerId,
  });

  if (!profile)
    return res.status(404).json({ error: "Profile không tồn tại!" });
  res.json({ profile });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { profileId } = req.params;
  const { name, isActive, contextRules } = req.body;

  const profile = await DynamicMusicProfile.findOneAndUpdate(
    { _id: new Types.ObjectId(profileId as any), owner: ownerId },
    {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
      ...(contextRules !== undefined && { contextRules }),
    },
    { new: true },
  );

  if (!profile)
    return res.status(404).json({ error: "Profile không tồn tại!" });
  res.json({ profile });
};

export const deleteProfile: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { profileId } = req.params;

  const profile = await DynamicMusicProfile.findOneAndDelete({
    _id: new Types.ObjectId(profileId as any),
    owner: ownerId,
  });

  if (!profile)
    return res.status(404).json({ error: "Profile không tồn tại!" });
  res.json({ message: "Profile đã được xóa!", profileId });
};

export const resetProfileToDefault: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { profileId } = req.params;

  const profile = await DynamicMusicProfile.findOneAndUpdate(
    { _id: new Types.ObjectId(profileId as any), owner: ownerId },
    { contextRules: buildDefaultContextRules() },
    { new: true },
  );

  if (!profile)
    return res.status(404).json({ error: "Profile không tồn tại!" });
  res.json({ profile });
};

export const resolveMix: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { profileId, audioId } = req.params;
  const { weather, activity, hour } = req.query as {
    weather?: WeatherType;
    activity?: ActivityType;
    hour?: string;
  };

  const profile = await DynamicMusicProfile.findOne({
    _id: new Types.ObjectId(profileId as any),
    owner: ownerId,
    isActive: true,
  });

  if (!profile)
    return res
      .status(404)
      .json({ error: "Profile không tồn tại hoặc không hoạt động!" });

  const contextInput: ContextInput = {
    weather: weather ?? "default",
    activity: activity ?? "default",
    hour: hour !== undefined ? parseInt(hour, 10) : new Date().getHours(),
  };

  const resolvedContexts = resolveContextsFromInput(contextInput);
  const timeOfDay = resolveTimeOfDay(contextInput.hour);
  const mix = computeMix(profile.contextRules, resolvedContexts);

  const session = new DynamicMusicSession({
    owner: ownerId,
    audio: new Types.ObjectId(audioId as any),
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

  await session.save();

  res.json({
    sessionId: session._id,
    resolvedContexts,
    timeOfDay,
    appliedAdjustments: mix.appliedAdjustments,
    ambientSoundUrl: mix.ambientSoundUrl,
    tempoMultiplier: mix.tempoMultiplier,
  });
};

export const endSession: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { sessionId } = req.params;

  const session = await DynamicMusicSession.findOneAndUpdate(
    {
      _id: new Types.ObjectId(sessionId as any),
      owner: ownerId,
      endedAt: { $exists: false },
    },
    { endedAt: new Date() },
    { new: true },
  );

  if (!session)
    return res
      .status(404)
      .json({ error: "Session không tồn tại hoặc đã kết thúc!" });
  res.json({ message: "Session đã kết thúc!", session });
};

export const getSessionHistory: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const page = parseInt((req.query.page as string) ?? "1", 10);

  const sessions = await DynamicMusicSession.find({ owner: ownerId })
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("audio", "title poster file")
    .populate("profile", "name");

  const total = await DynamicMusicSession.countDocuments({ owner: ownerId });

  res.json({ sessions, total, page, limit });
};

export const createAmbientSound: RequestHandler = async (
  req: RequestWithFiles,
  res,
) => {
  const ownerId = req.user.id;
  const audioFile = req.files?.file as formidable.File;

  if (!audioFile)
    return res.status(422).json({ error: "File âm thanh bị thiếu!" });

  const {
    name,
    triggerContexts,
    triggerWeather,
    triggerActivity,
    defaultGain,
    loop,
    tags,
    isPublic,
  } = req.body;

  const result = await cloudinary.uploader.upload(audioFile.filepath, {
    resource_type: "video",
    folder: "ambient_sounds",
  });

  const ambient = new AmbientSound({
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

  await ambient.save();
  res.status(201).json({ ambient });
};

export const getAmbientSounds: RequestHandler = async (req, res) => {
  const { context, weather, activity } = req.query as {
    context?: string;
    weather?: string;
    activity?: string;
  };

  const filter: Record<string, any> = { isPublic: true };

  if (context) filter.triggerContexts = context;
  if (weather) filter.triggerWeather = weather;
  if (activity) filter.triggerActivity = activity;

  const sounds = await AmbientSound.find(filter).sort({ createdAt: -1 });
  res.json({ sounds });
};

export const deleteAmbientSound: RequestHandler = async (req, res) => {
  const ownerId = req.user.id;
  const { soundId } = req.params;

  const sound = await AmbientSound.findOneAndDelete({
    _id: new Types.ObjectId(soundId as any),
    owner: ownerId,
  });

  if (!sound) return res.status(404).json({ error: "Âm thanh không tồn tại!" });

  await cloudinary.uploader.destroy(sound.file.publicId, {
    resource_type: "video",
  });
  res.json({ message: "Âm thanh môi trường đã được xóa!", soundId });
};

export const getDefaultRules: RequestHandler = (_req, res) => {
  res.json({ contextRules: buildDefaultContextRules() });
};
