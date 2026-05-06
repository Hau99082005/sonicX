import { AudioDocument } from "#/models/audio";
import { Request } from "express";
import { Types } from "mongoose";

export type PopulateFavList = AudioDocument<{
    _id: Types.ObjectId;
    name: string;
}>

export interface CreatePlaylist extends Request {
    body: {
        title: string,
        resId: string,
        visibility: ["public"| "private" | "auto"],
    }
}

export interface UpdatePlaylist extends Request {
    body: {
        title: string;
        id: string;
        item: string;
        visibility: ["public"| "private" | "auto"]
    }
}