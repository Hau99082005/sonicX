import { Router } from "express";
import { CreateUserSchema, SignInEmailValidationSchema, TokenAndIDValidation, updatedPasswordSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, generateForgotPasswordLink, grantValid, sendReVerificationToken, SignIn, updatePassword, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken } from "#/middleware/auth";
import { JwtPayload, verify } from "jsonwebtoken";
import { JWT_SECRET } from "#/utils/variables";
import User from "#/models/User";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReVerificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post('/verify-password-reset-token', validate(TokenAndIDValidation), isValidPasswordResetToken,
    grantValid);
router.post('/update-password', validate(updatedPasswordSchema), isValidPasswordResetToken, updatePassword);
router.post('/sign-in', validate(SignInEmailValidationSchema), SignIn);
router.get('/is-auth', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.split("Bearer ")[1]?.trim()
        : authorization?.trim();
    if (!token) return res.status(403).json({ error: "Unauthorized request!" });

    const payload = verify(token, JWT_SECRET) as JwtPayload;
    const id = payload.userId;

    const user = await User.findById(id);
    if (!user) return res.status(403).json({ error: "Unauthorized request!" });

    res.status(200).json({
        profile: {
            id: user._id, name: user.name, email: user.email,
            verified: user.verified, avatar: user.avatar?.url,
            followers: user.followers.length, following: user.followings.length
        },
    });
})

export default router;