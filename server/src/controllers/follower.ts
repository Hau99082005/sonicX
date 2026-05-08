import { paginationQuery } from "#/@types/misc";
import Audio, { AudioDocument } from "#/models/audio";
import History from "#/models/history";
import Playlist from "#/models/playlist";
import User from "#/models/User";
import { RequestHandler } from "express";
import { isValidObjectId, ObjectId, PipelineStage } from "mongoose";
import moment from "moment";

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

export const getPublicPlaylist: RequestHandler = async (req, res) => {
    const { profileId } = req.params;
    const { limit = "80", pageNo = "0" } = req.query as paginationQuery;
    if (!isValidObjectId(profileId)) return res.status(422).json({ error: "Invalid profile Id!" });
    const playlist = await Playlist.find({
        owner: profileId,
        visibility: 'public',
    }).skip(parseInt(limit) * parseInt(pageNo)).limit(parseInt(limit))
        .sort("-createdAt");

    if (!playlist) {
        return res.json({ playlist: [] });
    }

    res.json({
        playlist: playlist.map(item => {
            return {
                id: item._id,
                title: item.title,
                itemsCount: item.items.length,
                visibility: item.visibility,
            }
        })
    })

}

export const getRecommendByProfile: RequestHandler = async (req, res) => {
    const user = req.user;
    let matchOptions: PipelineStage.Match = { $match: { _id: { $exists: true } } }
    if (user) {
        const usersPreviosHistory = await History.aggregate([
            { $match: { owner: user.id } },
            { $unwind: "$all" },
            {
                $match: {
                    "all.date": {
                        $gte: moment().subtract(30, "days").toDate(),
                    }
                }
            },
            {
                $group: {
                    _id: "$all.audio"
                }
            },
            {
                $lookup: {
                    from: "audios",
                    localField: "_id",
                    foreignField: "_id",
                    as: "audioData"
                }
            },
            {
                $unwind: "$audioData"
            },
            {
                $group: { _id: null, category: { $addToSet: "$audioData.category" } }
            }
        ]);
        const categories = usersPreviosHistory[0].category;
        if (categories.length) {
            matchOptions = {
                $match: {
                    category: {
                        $in: categories
                    }
                }
            }
        }
    }
    const audio = await Audio.aggregate([
        matchOptions,
        {
            $sort: {
                "likes.count": -1
            }
        },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                _id: 0,
                id: "_id",
                title: "$title",
                category: "$category",
                about: "$about",
                file: "$file.url",
                poster: "$poster.url",
                owner: {
                    name: "$owner.name",
                    id: "$owner._id"
                }
            }
        }
    ]);
    res.json({ audio });
}