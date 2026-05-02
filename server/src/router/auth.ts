import { Router } from "express";
import { CreateUserSchema, TokenAndIDValidation, updatedPasswordSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, generateForgotPasswordLink, grantValid, sendReVerificationToken, updatePassword, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken } from "#/middleware/auth";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReVerificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post('/verify-password-reset-token', validate(TokenAndIDValidation),isValidPasswordResetToken,
grantValid);
router.post('/update-password', validate(updatedPasswordSchema),isValidPasswordResetToken,updatePassword);


export default router;