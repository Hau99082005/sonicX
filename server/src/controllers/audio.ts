import { RequestWithFiles } from "#/middleware/fileParser";
import { CategoriesType } from "#/models/audio_category";
import { RequestHandler } from "express";
import formidable from "formidable";
import cloudinary from "#/cloud";
import Audio from "#/models/audio";

interface CreateAudioRequest extends RequestWithFiles {
    body: {
        title: string;
        about: string;
        category: CategoriesType;
    }
}

export const createAudio: RequestHandler = async (req: CreateAudioRequest, res) => {
    const { title, about, category } = req.body;
    const poster = req.files?.poster as formidable.File;
    const audioFile = req.files?.file as formidable.File;
    const ownerId = req.user.id;

    if (!audioFile) return res.status(422).json({ error: "Audio file is missing!" });

    const audioResult = await cloudinary.uploader.upload(audioFile.filepath,
        { resource_type: "video" }
    );
    const newAudio = new Audio({
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
        const posterResult = await cloudinary.uploader.upload(poster.filepath, {
            width: 500,
            height: 500,
            crop: "thumb",
            gravity: "face"
        });
        newAudio.poster = { url: posterResult.secure_url, publicId: posterResult.public_id };
    }
    await newAudio.save();
    res.status(201).json({
        audio: {
            title, about, file: newAudio.file.url,
            poster: newAudio.poster?.url
        }
    });

}