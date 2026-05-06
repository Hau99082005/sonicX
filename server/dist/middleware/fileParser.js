"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const formidable_1 = __importDefault(require("formidable"));
const fileParser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.startsWith("multipart/form-data;")))
        return res.status(422).json({ error: "Only accepts form-data!" });
    const form = (0, formidable_1.default)({ multiples: false });
    const [fields, files] = yield form.parse(req);
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
});
exports.default = fileParser;
