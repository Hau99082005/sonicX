"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatProfile = exports.generateToken = void 0;
const generateToken = (length = 6) => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        const digit = Math.floor(Math.random() * 10);
        otp += digit;
    }
    return otp;
};
exports.generateToken = generateToken;
const formatProfile = (user) => {
    var _a;
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: (_a = user.avatar) === null || _a === void 0 ? void 0 : _a.url,
        followers: user.followers.length,
        following: user.followings.length
    };
};
exports.formatProfile = formatProfile;
