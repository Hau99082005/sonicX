import { Router } from "express";
import { CreateUserSchema, TokenAndIDValidation } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, generateForgotPasswordLink, isValidPasswordResetToken, sendReVerificationToken, verifyEmail } from "#/controllers/user";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReVerificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post('/verify-password-reset-token', validate(TokenAndIDValidation),isValidPasswordResetToken);


export default router;