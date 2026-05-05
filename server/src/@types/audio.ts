import { AudioDocument } from "#/models/audio";
import { Types } from "mongoose";

export type PopulateFavList = AudioDocument<{
    _id: Types.ObjectId;
    name: string;
}>
