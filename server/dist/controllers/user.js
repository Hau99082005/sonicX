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
exports.sendRePhoneOTP = exports.verifyPhoneOTP = exports.sendPhoneOTP = exports.googleSignIn = exports.getUser = exports.deleteAccount = exports.logOut = exports.sendProfile = exports.updateProfile = exports.SignIn = exports.updatePassword = exports.grantValid = exports.generateForgotPasswordLink = exports.sendReVerificationToken = exports.verifyEmail = exports.create = void 0;
const emailVerificationToken_1 = __importDefault(require("../models/emailVerificationToken"));
const phoneVerificationToken_1 = __importDefault(require("../models/phoneVerificationToken"));
const User_1 = __importDefault(require("../models/User"));
const helper_1 = require("../utils/helper");
const mail_1 = require("../utils/mail");
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const passwordResetToken_1 = __importDefault(require("../models/passwordResetToken"));
const crypto_1 = __importDefault(require("crypto"));
const variables_1 = require("../utils/variables");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloud_1 = __importDefault(require("../cloud"));
const Message_1 = __importDefault(require("../models/Message"));
const Story_1 = __importDefault(require("../models/Story"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, username, email, password } = req.body;
        const oldUser = yield User_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (oldUser) {
            if (oldUser.email === email)
                return res.status(403).json({ error: "Email is already in use!" });
            if (oldUser.username === username)
                return res.status(403).json({ error: "Username is already in use!" });
        }
        const newUser = yield User_1.default.create({
            name,
            username: username || email.split("@")[0],
            email,
            password,
        });
        const verificationToken = (0, helper_1.generateToken)();
        yield emailVerificationToken_1.default.create({
            owner: newUser._id.toString(),
            token: verificationToken,
        });
        (0, mail_1.sendVerificationMail)(verificationToken, {
            name,
            email,
            userId: newUser._id.toString(),
        }).catch((err) => console.error("[mail] sendVerificationMail failed:", err));
        const token = jsonwebtoken_1.default.sign({
            userId: newUser._id.toString(),
        }, variables_1.JWT_SECRET);
        newUser.token.push(token);
        yield newUser.save();
        return res.status(201).json({
            message: "Tạo user thành công",
            user: (0, helper_1.formatProfile)(newUser),
            token,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error,
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
        return res.status(403).json({ error: "Invalid token! (not found in DB)" });
    const matched = yield verificationToken.compareToken(token);
    if (!matched)
        return res.status(403).json({ error: "Invalid token! (token mismatch)" });
    yield User_1.default.findByIdAndUpdate(userId, {
        verified: true,
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
    if (user.verified)
        return res.status(422).json({ error: "You account is already verified!" });
    yield emailVerificationToken_1.default.findOneAndDelete({
        owner: userId,
    });
    const token = (0, helper_1.generateToken)();
    yield emailVerificationToken_1.default.create({
        owner: userId,
        token,
    });
    (0, mail_1.sendVerificationMail)(token, {
        name: user === null || user === void 0 ? void 0 : user.name,
        email: user === null || user === void 0 ? void 0 : user.email,
        userId: user === null || user === void 0 ? void 0 : user._id.toString(),
    });
    res
        .status(200)
        .json({ message: "Please check your email for verification!" });
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
    const token = crypto_1.default.randomBytes(36).toString("hex");
    yield passwordResetToken_1.default.create({
        owner: user._id.toString(),
        token,
    });
    const resetLink = `${variables_1.PASSWORD_RESET_URL}?token=${token}&userId=${user._id.toString()}`;
    (0, mail_1.sendForgotPasswordLink)({
        email: user.email,
        link: resetLink,
    });
    res
        .status(200)
        .json({ message: "Please check your email for the password reset link!" });
});
exports.generateForgotPasswordLink = generateForgotPasswordLink;
const grantValid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ valid: true });
});
exports.grantValid = grantValid;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { password, userId, oldPassword } = req.body;
    const targetId = userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    const user = yield User_1.default.findById(targetId);
    if (!user)
        return res.status(403).json({ error: "Unauthorized access!" });
    if (oldPassword) {
        const isMatched = yield user.comparePassword(oldPassword);
        if (!isMatched)
            return res.status(422).json({ error: "Mật khẩu cũ không chính xác!" });
    }
    const matched = yield user.comparePassword(password);
    if (matched)
        return res
            .status(422)
            .json({ error: "The new password must be different!" });
    user.password = password;
    yield user.save();
    if (userId)
        yield passwordResetToken_1.default.findOneAndDelete({ owner: user._id.toString() });
    (0, mail_1.sendPasswordResetSuccessEmail)(user.name, user.email);
    res.status(200).json({ message: "Password updated successfully!" });
});
exports.updatePassword = updatePassword;
const SignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(403).json({ error: "Email/password mismatch!" });
    const matched = yield user.comparePassword(password);
    if (!matched)
        return res.status(403).json({ error: "Email/password mismatch!" });
    const token = jsonwebtoken_1.default.sign({
        userId: user._id.toString(),
    }, variables_1.JWT_SECRET);
    user.token.push(token);
    yield user.save();
    res.status(200).json({
        profile: (0, helper_1.formatProfile)(user),
        token,
    });
});
exports.SignIn = SignIn;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { name, bio, username, phone, show_online_status } = req.body;
    const avatar = (_a = req.files) === null || _a === void 0 ? void 0 : _a.avatar;
    const coverImage = (_b = req.files) === null || _b === void 0 ? void 0 : _b.coverImage;
    const user = yield User_1.default.findById(req.user.id);
    if (!user)
        throw new Error("something went wrong, user not found!");
    if (name)
        user.name = name;
    if (bio)
        user.bio = bio;
    if (show_online_status !== undefined)
        user.show_online_status = show_online_status === 'true' || show_online_status === true;
    if (username && username.toLowerCase() !== user.username.toLowerCase()) {
        const existingUser = yield User_1.default.findOne({ username: username.toLowerCase() });
        if (existingUser)
            return res.status(422).json({ error: "Tên người dùng đã được sử dụng!" });
        user.username = username.toLowerCase();
    }
    if (phone && phone !== user.phone) {
        const existingPhone = yield User_1.default.findOne({ phone });
        if (existingPhone)
            return res.status(422).json({ error: "Số điện thoại đã được sử dụng!" });
        user.phone = phone;
    }
    if (avatar) {
        if ((_c = user.avatar) === null || _c === void 0 ? void 0 : _c.publicId) {
            yield cloud_1.default.uploader.destroy(user.avatar.publicId);
        }
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(avatar.filepath, {
            width: 400,
            height: 400,
            crop: "thumb",
            gravity: "face",
        });
        user.avatar = { url: secure_url, publicId: public_id };
    }
    if (coverImage) {
        if ((_d = user.cover_image) === null || _d === void 0 ? void 0 : _d.publicId) {
            yield cloud_1.default.uploader.destroy(user.cover_image.publicId);
        }
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(coverImage.filepath, {
            width: 1200,
            height: 400,
            crop: "fill",
        });
        user.cover_image = { url: secure_url, publicId: public_id };
    }
    yield user.save();
    res.status(200).json({ profile: (0, helper_1.formatProfile)(user) });
});
exports.updateProfile = updateProfile;
const sendProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findByIdAndUpdate(req.user.id, { is_online: true }, { new: true });
    if (!user)
        return res.status(404).json({ error: "User not found!" });
    res.status(200).json({ profile: (0, helper_1.formatProfile)(user) });
});
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
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const user = yield User_1.default.findById(userId);
        if (user) {
            if ((_a = user.avatar) === null || _a === void 0 ? void 0 : _a.publicId) {
                yield cloud_1.default.uploader.destroy(user.avatar.publicId).catch(() => { });
            }
            if ((_b = user.cover_image) === null || _b === void 0 ? void 0 : _b.publicId) {
                yield cloud_1.default.uploader.destroy(user.cover_image.publicId).catch(() => { });
            }
            yield Promise.all([
                User_1.default.findByIdAndDelete(userId),
                Message_1.default.deleteMany({ sender: userId }),
                Story_1.default.deleteMany({ user: userId }),
                Friendship_1.default.deleteMany({ $or: [{ requester: userId }, { receiver: userId }] }),
                Conversation_1.default.updateMany({ "members.user": userId }, { $pull: { members: { user: userId } } }),
                emailVerificationToken_1.default.deleteMany({ owner: userId }),
                passwordResetToken_1.default.deleteMany({ owner: userId }),
                phoneVerificationToken_1.default.deleteMany({ owner: userId }),
            ]);
        }
        res.status(200).json({ message: "Account deleted successfully!" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.deleteAccount = deleteAccount;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { query } = req.query;
    if (userId && (0, mongoose_1.isValidObjectId)(userId)) {
        const user = yield User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found!" });
        return res.status(200).json({ profile: (0, helper_1.formatProfile)(user) });
    }
    if (query) {
        const normalizedQuery = query
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        const users = yield User_1.default.find({
            $or: [
                { name: { $regex: normalizedQuery, $options: "i" } },
                { username: { $regex: normalizedQuery, $options: "i" } },
                { email: { $regex: normalizedQuery, $options: "i" } },
            ],
            _id: { $ne: req.user.id },
        }).limit(20);
        const usersWithStatus = yield Promise.all(users.map((u) => __awaiter(void 0, void 0, void 0, function* () {
            const friendship = yield Friendship_1.default.findOne({
                $or: [
                    { requester: req.user.id, receiver: u._id },
                    { requester: u._id, receiver: req.user.id },
                ],
            });
            return Object.assign(Object.assign({}, (0, helper_1.formatProfile)(u)), { friendshipStatus: friendship ? friendship.status : "none", isRequester: (friendship === null || friendship === void 0 ? void 0 : friendship.requester.toString()) === req.user.id.toString() });
        })));
        return res.status(200).json({ users: usersWithStatus });
    }
    const users = yield User_1.default.find({ _id: { $ne: req.user.id } })
        .sort({ createdAt: -1 })
        .limit(20);
    const usersWithStatus = yield Promise.all(users.map((u) => __awaiter(void 0, void 0, void 0, function* () {
        const friendship = yield Friendship_1.default.findOne({
            $or: [
                { requester: req.user.id, receiver: u._id },
                { requester: u._id, receiver: req.user.id },
            ],
        });
        return Object.assign(Object.assign({}, (0, helper_1.formatProfile)(u)), { friendshipStatus: friendship ? friendship.status : "none", isRequester: (friendship === null || friendship === void 0 ? void 0 : friendship.requester.toString()) === req.user.id.toString() });
    })));
    return res.status(200).json({ users: usersWithStatus });
});
exports.getUser = getUser;
const googleSignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idToken } = req.body;
    if (!idToken)
        return res.status(422).json({ error: "idToken is required!" });
    try {
        const response = yield axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const { email, name, picture, aud, email_verified } = response.data;
        if (!email) {
            return res
                .status(422)
                .json({ error: "Google account must have an email!" });
        }
        const validAudiences = [
            "739589186628-rpv9rta58toreqlv3mls1jpms763668b.apps.googleusercontent.com",
            "739589186628-6d69h4pqnjm4cuo3e0tq35p9re0ev4jo.apps.googleusercontent.com",
        ];
        if (!validAudiences.includes(aud)) {
            return res.status(401).json({ error: "Invalid token audience!" });
        }
        let user = yield User_1.default.findOne({ email });
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = new User_1.default({
                name: name || email.split("@")[0],
                username: email.split("@")[0],
                email,
                password: crypto_1.default.randomBytes(32).toString("hex"),
                verified: false,
            });
            if (picture) {
                user.avatar = { url: picture, publicId: "" };
            }
            yield user.save();
            const otp = (0, helper_1.generateToken)();
            yield emailVerificationToken_1.default.create({
                owner: user._id.toString(),
                token: otp,
            });
            (0, mail_1.sendVerificationMail)(otp, {
                name: user.name,
                email: user.email,
                userId: user._id.toString(),
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, variables_1.JWT_SECRET);
        user.token.push(token);
        yield user.save();
        return res.status(200).json({
            profile: (0, helper_1.formatProfile)(user),
            token,
            message: isNewUser
                ? "Vui lòng kiểm tra email để xác thực tài khoản!"
                : undefined,
        });
    }
    catch (error) {
        console.error("Google sign-in error:", error);
        return res.status(401).json({
            error: "Invalid or expired Google token!",
            detail: error.message,
        });
    }
});
exports.googleSignIn = googleSignIn;
const sendPhoneOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, phone } = req.body;
        if (!userId || !phone) {
            return res.status(422).json({ error: "userId và phone là bắt buộc!" });
        }
        if (!(0, mongoose_1.isValidObjectId)(userId)) {
            return res.status(422).json({ error: "Invalid userId!" });
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }
        const existingPhone = yield User_1.default.findOne({ phone, _id: { $ne: userId } });
        if (existingPhone) {
            return res.status(403).json({ error: "Số điện thoại đã được sử dụng!" });
        }
        const otp = (0, helper_1.generateToken)();
        const usingVerifyService = !!variables_1.TWILIO_VERIFY_SERVICE_SID;
        let deliveryMethod = "sms";
        let sentToEmail;
        let smsError;
        try {
            if (usingVerifyService) {
                yield (0, mail_1.sendPhoneVerificationSMS)(undefined, phone);
            }
            else {
                yield phoneVerificationToken_1.default.findOneAndDelete({ owner: userId });
                yield phoneVerificationToken_1.default.create({
                    owner: userId,
                    token: otp,
                    phone,
                });
                yield (0, mail_1.sendPhoneVerificationSMS)(otp, phone);
            }
        }
        catch (smsErr) {
            console.error("[sendPhoneOTP] SMS sending failed:", smsErr);
            deliveryMethod = "email";
            sentToEmail = user.email;
            smsError = smsErr instanceof Error ? smsErr.message : String(smsErr);
            yield phoneVerificationToken_1.default.findOneAndDelete({ owner: userId });
            yield phoneVerificationToken_1.default.create({
                owner: userId,
                token: otp,
                phone,
            });
            try {
                yield (0, mail_1.sendPhoneVerificationOTP)(otp, phone, user.name, user.email);
            }
            catch (emailErr) {
                console.error("[sendPhoneOTP] Fallback email sending also failed:", emailErr);
            }
        }
        res.status(200).json({
            message: deliveryMethod === "sms"
                ? "Mã OTP đã được gửi tới điện thoại của bạn."
                : "Mã OTP đã được gửi qua email vì SMS không khả dụng.",
            phone: phone.slice(-2).padStart(phone.length, "*"),
            debug: {
                deliveryMethod,
                sentToEmail,
                smsError,
            },
        });
    }
    catch (error) {
        console.error("[sendPhoneOTP] error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});
exports.sendPhoneOTP = sendPhoneOTP;
const verifyPhoneOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, userId, phone } = req.body;
        if (!token || !userId || !phone) {
            return res
                .status(422)
                .json({ error: "token, userId và phone là bắt buộc!" });
        }
        if (!(0, mongoose_1.isValidObjectId)(userId)) {
            return res.status(422).json({ error: "Invalid userId!" });
        }
        const useVerifyService = !!variables_1.TWILIO_VERIFY_SERVICE_SID;
        let isVerified = false;
        let verificationToken;
        if (useVerifyService) {
            try {
                const verificationCheck = yield (0, mail_1.verifyPhoneVerificationCode)(phone, token);
                if (verificationCheck.status === "approved") {
                    isVerified = true;
                }
            }
            catch (verifyErr) {
                console.warn("[verifyPhoneOTP] Twilio verification failed, falling back to DB lookup:", verifyErr);
            }
        }
        if (!isVerified) {
            verificationToken = yield phoneVerificationToken_1.default.findOne({
                owner: userId,
            });
            if (!verificationToken) {
                return res.status(403).json({
                    error: "Invalid token! (not found in DB)",
                    hint: "Make sure you called /auth/send-phone-otp first to generate an OTP",
                });
            }
            const matched = yield verificationToken.compareToken(token);
            if (!matched) {
                return res
                    .status(403)
                    .json({ error: "Invalid token! (token mismatch)" });
            }
            if (verificationToken.phone !== phone) {
                return res.status(403).json({
                    error: "Invalid phone number!",
                    dbPhone: verificationToken.phone,
                    receivedPhone: phone,
                });
            }
            yield phoneVerificationToken_1.default.findByIdAndDelete(verificationToken._id);
        }
        else {
            yield phoneVerificationToken_1.default.findOneAndDelete({ owner: userId });
        }
        yield User_1.default.findByIdAndUpdate(userId, {
            phone,
            phoneVerified: true,
        });
        res
            .status(200)
            .json({ message: "Điện thoại đã được xác minh thành công!" });
    }
    catch (error) {
        console.error("[verifyPhoneOTP] error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});
exports.verifyPhoneOTP = verifyPhoneOTP;
const sendRePhoneOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, phone } = req.body;
        if (!userId || !phone) {
            return res.status(422).json({ error: "userId và phone là bắt buộc!" });
        }
        if (!(0, mongoose_1.isValidObjectId)(userId)) {
            return res.status(422).json({ error: "Invalid userId!" });
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }
        const otp = (0, helper_1.generateToken)();
        const usingVerifyService = !!variables_1.TWILIO_VERIFY_SERVICE_SID;
        let deliveryMethod = "sms";
        let smsError;
        try {
            if (usingVerifyService) {
                yield (0, mail_1.sendPhoneVerificationSMS)(undefined, phone);
            }
            else {
                yield phoneVerificationToken_1.default.findOneAndDelete({ owner: userId });
                yield phoneVerificationToken_1.default.create({
                    owner: userId,
                    token: otp,
                    phone,
                });
                yield (0, mail_1.sendPhoneVerificationSMS)(otp, phone);
            }
        }
        catch (smsErr) {
            console.error("[sendRePhoneOTP] SMS sending failed:", smsErr);
            deliveryMethod = "email";
            smsError = smsErr instanceof Error ? smsErr.message : String(smsErr);
            yield phoneVerificationToken_1.default.findOneAndDelete({ owner: userId });
            yield phoneVerificationToken_1.default.create({
                owner: userId,
                token: otp,
                phone,
            });
            try {
                yield (0, mail_1.sendPhoneVerificationOTP)(otp, phone, user.name, user.email);
            }
            catch (emailErr) {
                console.error("[sendRePhoneOTP] Fallback email sending also failed:", emailErr);
            }
        }
        res.status(200).json({
            message: deliveryMethod === "sms"
                ? "Mã OTP mới đã được gửi tới điện thoại của bạn."
                : "Mã OTP mới đã được gửi qua email vì SMS không khả dụng.",
            phone: phone.slice(-2).padStart(phone.length, "*"),
            debug: {
                deliveryMethod,
                smsError,
            },
        });
    }
    catch (error) {
        console.error("[sendRePhoneOTP] error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
});
exports.sendRePhoneOTP = sendRePhoneOTP;
