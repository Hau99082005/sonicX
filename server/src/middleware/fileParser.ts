import { Request, RequestHandler } from "express";
import formidable, { File } from "formidable";

export interface RequestWithFiles extends Request {
    files?: { [key: string]: File };
}

const fileParser: RequestHandler = async (req: RequestWithFiles, res, next) => {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.startsWith("multipart/form-data")) {
        return next();
    }

    const form = formidable({ multiples: false });

    const [fields, files] = await form.parse(req);

    req.body = {};

    for (let key in fields) {
        const field = fields[key];
        if (field) {
            req.body[key] = field[0];
        }
    }

    for (let key in files) {
        const file = files[key];

        if (!req.files) {
            req.files = {};
        }

        if (file) {
            req.files[key] = file[0];
        }
    }

    next();
};

export default fileParser;