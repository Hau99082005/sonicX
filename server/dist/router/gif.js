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
const TENOR_KEY = process.env.TENOR_API_KEY || "";
const freeGifs = [
    {
        id: "1",
        url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
        preview: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/200w_d.jpg",
    },
    {
        id: "2",
        url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        preview: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w_d.jpg",
    },
    {
        id: "3",
        url: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
        preview: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/200w_d.jpg",
    },
    {
        id: "4",
        url: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
        preview: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/200w_d.jpg",
    },
    {
        id: "5",
        url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
        preview: "https://media.giphy.com/media/5GoVLqeAOo6PK/200w_d.jpg",
    },
    {
        id: "6",
        url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
        preview: "https://media.giphy.com/media/ICOgUNjpvO0PC/200w_d.jpg",
    },
    {
        id: "7",
        url: "https://media.giphy.com/media/3oEjHGrVGrqgFFknfO/giphy.gif",
        preview: "https://media.giphy.com/media/3oEjHGrVGrqgFFknfO/200w_d.jpg",
    },
    {
        id: "8",
        url: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
        preview: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w_d.jpg",
    },
    {
        id: "9",
        url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
        preview: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w_d.jpg",
    },
    {
        id: "10",
        url: "https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/giphy.gif",
        preview: "https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/200w_d.jpg",
    },
];
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 24, 48);
    if (!TENOR_KEY) {
        if (!query)
            return res.json({ gifs: freeGifs.slice(0, limit) });
        const q = query.toLowerCase();
        const filtered = freeGifs.filter((g) => g.url.includes(q) || g.preview.includes(q));
        return res.json({
            gifs: (filtered.length ? filtered : freeGifs).slice(0, limit),
        });
    }
    const url = query
        ? `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&media_filter=gif&content_filter=medium`
        : `https://tenor.googleapis.com/v2/trending?key=${TENOR_KEY}&limit=${limit}&media_filter=gif&content_filter=medium`;
    try {
        const response = yield axios_1.default.get(url);
        const gifs = (response.data.results || []).map((item) => {
            var _a, _b, _c, _d;
            const media = ((_a = item.media_formats) === null || _a === void 0 ? void 0 : _a.gif) ||
                ((_b = item.media_formats) === null || _b === void 0 ? void 0 : _b.mediumgif) ||
                ((_c = item.media_formats) === null || _c === void 0 ? void 0 : _c.nanogif);
            return {
                id: item.id,
                title: item.content_description || item.title || "",
                url: (media === null || media === void 0 ? void 0 : media.url) || "",
                preview: ((_d = media === null || media === void 0 ? void 0 : media.preview) === null || _d === void 0 ? void 0 : _d.url) || (media === null || media === void 0 ? void 0 : media.url) || "",
            };
        });
        res.json({ gifs: gifs.filter((item) => item.url) });
    }
    catch (err) {
        const e = err;
        res
            .status(500)
            .json({ error: ((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || "Failed to fetch gifs" });
    }
}));
exports.default = router;
