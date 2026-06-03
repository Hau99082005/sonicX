"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validationSchema_1 = require("../utils/validationSchema");
const validator_1 = require("../middleware/validator");
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const fileParser_1 = __importDefault(require("../middleware/fileParser"));
const router = (0, express_1.Router)();
router.post("/create", (0, validator_1.validate)(validationSchema_1.CreateUserSchema), user_1.create);
router.post("/verify-email", (0, validator_1.validate)(validationSchema_1.TokenAndIDValidation), user_1.verifyEmail);
router.post("/re-verify-email", user_1.sendReVerificationToken);
router.post("/forgot-password", user_1.generateForgotPasswordLink);
router.post("/verify-password-reset-token", (0, validator_1.validate)(validationSchema_1.TokenAndIDValidation), auth_1.isValidPasswordResetToken, user_1.grantValid);
router.post("/update-password", (0, validator_1.validate)(validationSchema_1.updatedPasswordSchema), auth_1.isValidPasswordResetToken, user_1.updatePassword);
router.post("/sign-in", (0, validator_1.validate)(validationSchema_1.SignInEmailValidationSchema), user_1.SignIn);
router.post("/google-sign-in", user_1.googleSignIn);
router.post("/send-phone-otp", (0, validator_1.validate)(validationSchema_1.SendPhoneOTPSchema), user_1.sendPhoneOTP);
router.post("/verify-phone-otp", (0, validator_1.validate)(validationSchema_1.VerifyPhoneOTPSchema), user_1.verifyPhoneOTP);
router.post("/resend-phone-otp", (0, validator_1.validate)(validationSchema_1.SendPhoneOTPSchema), user_1.sendRePhoneOTP);
router.get("/is-auth", auth_1.mustAuth, user_1.sendProfile);
router.get("/public", (req, res) => {
    res.status(200).json({
        message: "You are in public route!",
    });
});
router.get("/private", auth_1.mustAuth, (req, res) => {
    res.status(200).json({
        message: "You are in private route!",
    });
});
router.patch("/update-profile", auth_1.mustAuth, fileParser_1.default, user_1.updateProfile);
router.patch("/update-password-auth", auth_1.mustAuth, user_1.updatePassword);
router.post("/log-out", auth_1.mustAuth, user_1.logOut);
router.get("/user", auth_1.mustAuth, user_1.getUser);
router.delete("/delete-account", auth_1.mustAuth, user_1.deleteAccount);
exports.default = router;
