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
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = require("bcryptjs");
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firebase_uid: {
        type: String,
        unique: true,
        sparse: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
    },
    google_id: {
        type: String,
        unique: true,
        sparse: true,
    },
    login_type: {
        type: String,
        enum: ["email", "google"],
        default: "email",
    },
    avatar: {
        type: {
            url: String,
            publicId: String,
        },
        _id: false,
    },
    cover_image: {
        type: {
            url: String,
            publicId: String,
        },
        _id: false,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    is_online: {
        type: Boolean,
        default: false,
    },
    last_seen: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    phone: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    phoneVerified: {
        type: Boolean,
        default: false,
    },
    show_online_status: {
        type: Boolean,
        default: true,
    },
    token: [String],
}, { timestamps: true });
userSchema.pre("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password") && this.password) {
            this.password = yield (0, bcryptjs_1.hash)(this.password, 10);
        }
    });
});
userSchema.methods.comparePassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.password)
            return false;
        return yield (0, bcryptjs_1.compare)(password, this.password);
    });
};
exports.default = (0, mongoose_1.model)("User", userSchema);
