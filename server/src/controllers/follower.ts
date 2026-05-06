import User from "#/models/User";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

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
