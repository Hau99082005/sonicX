import { Router } from "express";
import { CreateUserSchema, SignInEmailValidationSchema, TokenAndIDValidation, updatedPasswordSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, generateForgotPasswordLink, grantValid, sendProfile, sendReVerificationToken, SignIn, updatePassword, updateProfile, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken, mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReVerificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post('/verify-password-reset-token', validate(TokenAndIDValidation), isValidPasswordResetToken,
    grantValid);
router.post('/update-password', validate(updatedPasswordSchema), isValidPasswordResetToken, updatePassword);
router.post('/sign-in', validate(SignInEmailValidationSchema), SignIn);
router.get('/is-auth', mustAuth, sendProfile);
router.get('/public', (req, res) => {
    res.status(200).json({
        message: "You are in public route!"
    });
});
router.get('/private', mustAuth, (req, res) => {
    res.status(200).json({
        message: "You are in private route!",
    });
});

router.post('/update-profile', mustAuth, fileParser, updateProfile);
export default router;