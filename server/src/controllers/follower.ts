import { paginationQuery } from "#/@types/misc";
import Audio, { AudioDocument } from "#/models/audio";
import User from "#/models/User";
import { RequestHandler } from "express";
import { isValidObjectId, ObjectId } from "mongoose";

export const updatedFollower: RequestHandler = async (req, res) => {
    const { profileId } = req.params;
    let status: "added" | "removed";

    if (!isValidObjectId(profileId)) return res.status(422).json({ error: "Invalid profile id!" });

    const profile = await User.findById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found!" });

    const alreadyFollower = profile.followers.some(
        (id) => id.toString() === req.user.id
    );

    if (alreadyFollower) {
        await User.findByIdAndUpdate(profileId, { $pull: { followers: req.user.id } });
        status = "removed";
    } else {
        await User.findByIdAndUpdate(profileId, { $addToSet: { followers: req.user.id } });
        status = "added";
    }

    res.status(200).json({ status });
}

export const getUploads: RequestHandler = async (req, res) => {
    const { limit = "80", pageNo = "0" } = req.query as paginationQuery;

    const data = await Audio.find({ owner: req.user.id })
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")

    const audios = data.map(item => {
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            poster: item.poster?.url,
            date: item.createdAt,
            owner: { name: req.user.name, id: req.user.id }
        }
    })
    res.json({ audios });
}

export const getPublicUploads: RequestHandler = async (req, res) => {
    const { limit = "80", pageNo = "0" } = req.query as paginationQuery;
    const { profileId } = req.params;

    if (!isValidObjectId(profileId)) return res.status(422).json({ error: "Invalid profile Id!" });
    const data = await Audio.find({ owner: profileId })
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")
        .populate<AudioDocument<{ name: string; _id: ObjectId }>>("owner")

    const audios = data.map(item => {
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            poster: item.poster?.url,
            date: item.createdAt,
            owner: { name: item.owner.name, id: item.owner._id }
        }
    })
    res.json({ audios });
}

export const getPublicProfile: RequestHandler = async (req, res) => {
    const { profileId } = req.params;
    if (!isValidObjectId(profileId)) return res.status(422).json({ error: "Invalid profile Id!" });
    const user = await User.findById(profileId);
    if (!user) return res.status(404).json({ error: "User not found!" });

    res.json({
        profile: {
            id: user._id,
            name: user.name,
            followers: user.followers.length,
            avatar: user.avatar?.url
        }
    })
}