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
exports.isVerified = exports.isAuth = exports.mustAuth = exports.isValidPasswordResetToken = void 0;
const passwordResetToken_1 = __importDefault(require("../models/passwordResetToken"));
const User_1 = __importDefault(require("../models/User"));
const variables_1 = require("../utils/variables");
const jsonwebtoken_1 = require("jsonwebtoken");
const isValidPasswordResetToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, userId } = req.body;
    const resetToken = yield passwordResetToken_1.default.findOne({ owner: userId });
    if (!resetToken)
        return res.status(403).json({ error: "Unauthorized access, invalid token!" });
    const matched = yield resetToken.compareToken(token);
    if (!matched)
        return res.status(403).json({ error: "Unauthorized access, invalid token!" });
    next();
});
exports.isValidPasswordResetToken = isValidPasswordResetToken;
const mustAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { authorization } = req.headers;
    const token = (authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))
        ? (_a = authorization.split("Bearer ")[1]) === null || _a === void 0 ? void 0 : _a.trim()
        : authorization === null || authorization === void 0 ? void 0 : authorization.trim();
    if (!token)
        return res.status(403).json({ error: "Unauthorized request!" });
    const payload = (0, jsonwebtoken_1.verify)(token, variables_1.JWT_SECRET);
    const id = payload.userId;
    const user = yield User_1.default.findOne({ _id: id, token: token });
    if (!user)
        return res.status(403).json({ error: "Unauthorized request!" });
    req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: (_b = user.avatar) === null || _b === void 0 ? void 0 : _b.url,
        followers: user.followers.length,
        following: user.followings.length
    };
    req.token = token;
    next();
});
exports.mustAuth = mustAuth;
const isAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { authorization } = req.headers;
    const token = (authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))
        ? (_a = authorization.split("Bearer ")[1]) === null || _a === void 0 ? void 0 : _a.trim()
        : authorization === null || authorization === void 0 ? void 0 : authorization.trim();
    if (token) {
        const payload = (0, jsonwebtoken_1.verify)(token, variables_1.JWT_SECRET);
        const id = payload.userId;
        const user = yield User_1.default.findOne({ _id: id, token: token });
        if (!user)
            return res.status(403).json({ error: "Unauthorized request!" });
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified,
            avatar: (_b = user.avatar) === null || _b === void 0 ? void 0 : _b.url,
            followers: user.followers.length,
            following: user.followings.length
        };
        req.token = token;
    }
    next();
});
exports.isAuth = isAuth;
const isVerified = (req, res, next) => {
    if (!req.user.verified) {
        return res.status(403).json({ error: "Please verify your email account!" });
    }
    next();
};
exports.isVerified = isVerified;
