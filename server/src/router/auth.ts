import { Router } from "express";
import {
  CreateUserSchema,
  SignInEmailValidationSchema,
  TokenAndIDValidation,
  updatedPasswordSchema,
  SendPhoneOTPSchema,
  VerifyPhoneOTPSchema,
} from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import {
  create,
  deleteAccount,
  generateForgotPasswordLink,
  getUser,
  googleSignIn,
  grantValid,
  logOut,
  sendProfile,
  sendReVerificationToken,
  SignIn,
  updatePassword,
  updateProfile,
  verifyEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  sendRePhoneOTP,
} from "#/controllers/user";
import { isValidPasswordResetToken, mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/create", validate(CreateUserSchema), create);
router.post("/verify-email", validate(TokenAndIDValidation), verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forgot-password", generateForgotPasswordLink);
router.post(
  "/verify-password-reset-token",
  validate(TokenAndIDValidation),
  isValidPasswordResetToken,
  grantValid,
);
router.post(
  "/update-password",
  validate(updatedPasswordSchema),
  isValidPasswordResetToken,
  updatePassword,
);
router.post("/sign-in", validate(SignInEmailValidationSchema), SignIn);
router.post("/google-sign-in", googleSignIn);

router.post("/send-phone-otp", validate(SendPhoneOTPSchema), sendPhoneOTP);
router.post(
  "/verify-phone-otp",
  validate(VerifyPhoneOTPSchema),
  verifyPhoneOTP,
);
router.post("/resend-phone-otp", validate(SendPhoneOTPSchema), sendRePhoneOTP);

router.get("/is-auth", mustAuth, sendProfile);
router.get("/public", (req, res) => {
  res.status(200).json({
    message: "You are in public route!",
  });
});
router.get("/private", mustAuth, (req, res) => {
  res.status(200).json({
    message: "You are in private route!",
  });
});

router.patch("/update-profile", mustAuth, fileParser, updateProfile);
router.post("/log-out", mustAuth, logOut);
router.get("/user", mustAuth, getUser);
router.delete("/delete-account", mustAuth, deleteAccount);
export default router;
