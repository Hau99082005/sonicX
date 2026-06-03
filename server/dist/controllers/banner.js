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
exports.getBannerById = exports.deleteBanners = exports.updateBanners = exports.createBanners = exports.getBanners = void 0;
const Banner_1 = __importDefault(require("../models/Banner"));
const getBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banners = yield Banner_1.default.find({}).sort({ createdAt: -1 });
        return res.status(200).json(banners);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.getBanners = getBanners;
const createBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, banner } = req.body;
        if (!title || !banner) {
            return res
                .status(400)
                .json({ message: "Title and Banner are required!" });
        }
        else {
            const newBanner = new Banner_1.default({ title, banner });
            yield newBanner.save();
            return res.status(201).json(newBanner);
        }
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Internal Server Error" });
    }
});
exports.createBanners = createBanners;
const updateBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Banner ID is required!" });
        }
        const updatedBanner = yield Banner_1.default.findByIdAndUpdate(id, Object.assign({}, req.body), { new: true });
        if (!updatedBanner) {
            return res.status(404).json({ message: "Banner not found!" });
        }
        else {
            return res.status(200).json(updatedBanner);
        }
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Internal Server Error" });
    }
});
exports.updateBanners = updateBanners;
const deleteBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Banner ID is required!" });
        }
        const deletedBanner = yield Banner_1.default.findByIdAndDelete(id);
        if (!deletedBanner) {
            return res.status(404).json({ message: "Banner not found!" });
        }
        else {
            return res.status(200).json({ message: "Banner deleted successfully!" });
        }
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Internal Server Error" });
    }
});
exports.deleteBanners = deleteBanners;
const getBannerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Banner ID is required!" });
        }
        const banner = yield Banner_1.default.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found!" });
        }
        else {
            return res.status(200).json(banner);
        }
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message || "Internal Server Error" });
    }
});
exports.getBannerById = getBannerById;
