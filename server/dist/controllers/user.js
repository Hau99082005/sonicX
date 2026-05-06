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
exports.logOut = exports.sendProfile = exports.updateProfile = exports.SignIn = exports.updatePassword = exports.grantValid = exports.generateForgotPasswordLink = exports.sendReVerificationToken = exports.verifyEmail = exports.create = void 0;
const emailVerificationToken_1 = __importDefault(require("../models/emailVerificationToken"));
const User_1 = __importDefault(require("../models/User"));
const helper_1 = require("../utils/helper");
const mail_1 = require("../utils/mail");
const validationSchema_1 = require("../utils/validationSchema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const passwordResetToken_1 = __importDefault(require("../models/passwordResetToken"));
const crypto_1 = __importDefault(require("crypto"));
const variables_1 = require("../utils/variables");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloud_1 = __importDefault(require("../cloud"));
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        validationSchema_1.CreateUserSchema.validate({ email, name, password });
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_1.default.create({
            name,
            email,
            password: hashedPassword
        });
        const token = (0, helper_1.generateToken)();
        yield emailVerificationToken_1.default.create({
            owner: newUser._id.toString(),
            token,
        });
        (0, mail_1.sendVerificationMail)(token, { name, email, userId: newUser._id.toString() });
        return res.status(201).json({
            message: "Tạo user thành công",
            user: { id: newUser._id, name, email }
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error
        });
    }
});
exports.create = create;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, userId } = req.body;
    const verificationToken = yield emailVerificationToken_1.default.findOne({
        owner: userId,
    });
    if (!verificationToken)
        return res.status(403).json({ error: "Invalid token!" });
    const matched = yield verificationToken.compareToken(token);
    if (!matched)
        return res.status(403).json({ error: "Invalid token!" });
    yield User_1.default.findByIdAndUpdate(userId, {
        verified: true
    });
    yield emailVerificationToken_1.default.findByIdAndDelete(verificationToken._id);
    res.status(200).json({ message: "Email verified successfully!" });
});
exports.verifyEmail = verifyEmail;
const sendReVerificationToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    if (!(0, mongoose_1.isValidObjectId)(userId))
        return res.status(403).json({ error: "Invalid request!" });
    const user = yield User_1.default.findById(userId);
    if (!user)
        return res.status(403).json({ error: "Invalid request!" });
    yield emailVerificationToken_1.default.findOneAndDelete({
        owner: userId,
    });
    const token = (0, helper_1.generateToken)();
    yield emailVerificationToken_1.default.create({
        owner: userId,
        token
    });
    (0, mail_1.sendVerificationMail)(token, {
        name: user === null || user === void 0 ? void 0 : user.name,
        email: user === null || user === void 0 ? void 0 : user.email,
        userId: user === null || user === void 0 ? void 0 : user._id.toString(),
    });
    res.status(200).json({ message: "Please check your email for verification!" });
});
exports.sendReVerificationToken = sendReVerificationToken;
const generateForgotPasswordLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(404).json({ error: "Account not found!" });
    yield passwordResetToken_1.default.findOneAndDelete({
        owner: user._id.toString(),
    });
    const token = crypto_1.default.randomBytes(36).toString('hex');
    yield passwordResetToken_1.default.create({
        owner: user._id.toString(),
        token
    });
    const resetLink = `${variables_1.PASSWORD_RESET_URL}?token=${token}&userId=${user._id.toString()}`;
    (0, mail_1.sendForgotPasswordLink)({
        email: user.email,
        link: resetLink
    });
    res.status(200).json({ message: "Please check your email for the password reset link!" });
});
exports.generateForgotPasswordLink = generateForgotPasswordLink;
const grantValid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ valid: true });
});
exports.grantValid = grantValid;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password, userId } = req.body;
    const user = yield User_1.default.findById(userId);
    if (!user)
        return res.status(403).json({ error: "Unauthorized access!" });
    const matched = yield user.comparePassword(password);
    if (matched)
        return res.status(422).json({ error: "The new password must be different!" });
    user.password = password;
    yield user.save();
    yield passwordResetToken_1.default.findOneAndDelete({ owner: user._id.toString() });
    (0, mail_1.sendPasswordResetSuccessEmail)(user.name, user.email);
    res.status(200).json({ message: "Password updated successfully!" });
});
exports.updatePassword = updatePassword;
const SignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(403).json({ error: "Email/password mismatch!" });
    const matched = yield user.comparePassword(password);
    if (!matched)
        return res.status(403).json({ error: "Email/password mismatch!" });
    const token = jsonwebtoken_1.default.sign({
        userId: user._id.toString()
    }, variables_1.JWT_SECRET);
    user.token.push(token);
    yield user.save();
    res.status(200).json({
        profile: {
            id: user._id, name: user.name, email: user.email,
            verified: user.verified, avatar: (_a = user.avatar) === null || _a === void 0 ? void 0 : _a.url,
            followers: user.followers.length, following: user.followings.length
        },
        token
    });
});
exports.SignIn = SignIn;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { name } = req.body;
    const avatar = (_a = req.files) === null || _a === void 0 ? void 0 : _a.avatar;
    const user = yield User_1.default.findById(req.user.id);
    if (!user)
        throw new Error("something went wrong, user not found!");
    if (typeof name !== "string")
        return res.status(422).json({ error: "Invalid name!" });
    if (name.trim().length < 3)
        return res.status(422).json({ error: "Name must be at least 3 characters long!" });
    user.name = name;
    if (avatar) {
        if ((_b = user.avatar) === null || _b === void 0 ? void 0 : _b.publicId) {
            yield cloud_1.default.uploader.destroy(user.avatar.publicId);
        }
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(avatar.filepath, {
            width: 400,
            height: 400,
            crop: "thumb",
            gravity: "face"
        });
        user.avatar = { url: secure_url, publicId: public_id };
    }
    yield user.save();
    res.status(200).json({ profile: (0, helper_1.formatProfile)(user) });
});
exports.updateProfile = updateProfile;
const sendProfile = (req, res) => {
    res.status(200).json({ profile: req.user });
};
exports.sendProfile = sendProfile;
const logOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fromAll } = req.query;
    const token = req.token;
    const user = yield User_1.default.findById(req.user.id);
    if (!user)
        throw new Error("something went wrong, user not found!");
    if (fromAll === "yes")
        user.token = [];
    else
        user.token = user.token.filter((tokens) => tokens !== token);
    yield user.save();
    res.status(200).json({ success: true });
});
exports.logOut = logOut;
