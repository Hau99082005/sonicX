import Audio from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express";
import { isValidObjectId, Types } from "mongoose";

export const toggleFavorite: RequestHandler = async (req, res) => {
    const audioId = req.query.audioId as string;
    let status: "added" | "removed";

    if (!isValidObjectId(audioId)) return res.status(422).json({ error: "Audio id is invalid!" });

    const audio = await Audio.findById(audioId);
    if (!audio) return res.status(404).json({ error: "Resource not found!" });

    const objectId = new Types.ObjectId(audioId);

    const alreadyExists = await Favorite.findOne({
        owner: req.user.id,
        items: { $elemMatch: { $eq: objectId } }
    });

    if (alreadyExists) {
        await Favorite.updateOne({ owner: req.user.id }, {
            $pull: { items: objectId }
        });
        status = "removed";
    } else {
        const favorite = await Favorite.findOne({ owner: req.user.id });
        if (favorite) {
            await Favorite.updateOne({ owner: req.user.id }, {
                $addToSet: { items: objectId }
            });
        } else {
            await Favorite.create({ owner: req.user.id, items: [objectId] });
        }
        status = "added";
    }

    res.json({ status });
}
