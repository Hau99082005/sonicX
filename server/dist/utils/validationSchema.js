"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistValidationSchema = exports.AudioValidationSchema = exports.SignInEmailValidationSchema = exports.updatedPasswordSchema = exports.TokenAndIDValidation = exports.CreateUserSchema = void 0;
const yup = __importStar(require("yup"));
const mongoose_1 = require("mongoose");
const audio_category_1 = require("../models/audio_category");
exports.CreateUserSchema = yup.object().shape({
    name: yup.string().trim().required("Name is missing").min(3, "Name is too short").max(255, "Name is too long"),
    email: yup.string().trim().required("Email is missing").email("Email is invalid"),
    password: yup.string().trim().required("Password is missing").min(8, 'Password is too short').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character")
});
exports.TokenAndIDValidation = yup.object()
    .shape({
    token: yup.string().trim().required("Invalid token!"),
    userId: yup.string().transform(function (value) {
        if (this.isType(value) && (0, mongoose_1.isValidObjectId)(value)) {
            return value;
        }
        else {
            return "";
        }
    }).required("Invalid userId!"),
});
exports.updatedPasswordSchema = yup.object().shape({
    token: yup.string().trim().required("Invalid token!"),
    userId: yup.string().transform(function (value) {
        if (this.isType(value) && (0, mongoose_1.isValidObjectId)(value)) {
            return value;
        }
        else {
            return "";
        }
    }).required("Invalid userId!"),
    password: yup.string().trim().required("Password is missing").min(8, 'Password is too short').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character")
});
exports.SignInEmailValidationSchema = yup.object().shape({
    email: yup.string().trim().required("Email is missing").email('Invalid email id!'),
    password: yup.string().trim().required("Password is missing"),
});
exports.AudioValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing!"),
    about: yup.string().required("About is missing!"),
    category: yup.string().oneOf(audio_category_1.categories, "Invalid category!")
        .required("Category is missing!")
});
exports.PlaylistValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing!"),
    resId: yup.string().transform(function (value) {
        return this.isType(value) && (0, mongoose_1.isValidObjectId)(value) ? value : "";
    }),
    visibility: yup.string()
        .oneOf(["public", "private"], "Visibility must be public or private!")
        .required("Visibility is missing!")
});
