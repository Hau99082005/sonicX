import { RequestHandler } from "express";
import formidable from "formidable";

const fileParser: RequestHandler = async (req, res, next) => {
    if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
        return res.status(422).json({ error: "Only accepts form-data!" });
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);


    for (let key in fields) {
        const field = fields[key];
        if (field) {
            if (!req.body) req.body = {};
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
}

export default fileParser;