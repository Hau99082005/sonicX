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
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
let cache = null;
const TTL = 1000 * 60 * 60 * 6;
function filenameToChar(name) {
    const base = name.replace(/^emoji_u/, "").replace(/\.svg$/, "");
    const parts = base.split("_");
    const cps = parts.map((p) => parseInt(p, 16));
    return String.fromCodePoint(...cps);
}
router.get("/list", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (cache && Date.now() - cache.updated < TTL)
            return res.json({ emojis: cache.list });
        const gh = yield axios_1.default.get("https://api.github.com/repos/googlefonts/noto-emoji/git/trees/main?recursive=1", { headers: { "User-Agent": "sonicx" } });
        const tree = gh.data.tree || [];
        const svgs = tree
            .map((t) => t.path)
            .filter((p) => p.startsWith("svg/emoji_u") && p.endsWith(".svg"));
        const list = svgs.map((p) => {
            const filename = p.split("/").pop();
            const char = filename ? filenameToChar(filename.replace(".svg", "")) : "";
            const url = `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/${filename}`;
            return { char, filename, url };
        });
        cache = { updated: Date.now(), list };
        res.json({ emojis: list });
    }
    catch (err) {
        console.error("emoji list err", err.message || err);
        if (cache)
            return res.json({ emojis: cache.list });
        res.status(500).json({ error: "failed" });
    }
}));
exports.default = router;
