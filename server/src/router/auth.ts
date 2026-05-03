import { Router } from "express";
import { CreateUserSchema, SignInEmailValidationSchema, TokenAndIDValidation, updatedPasswordSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, generateForgotPasswordLink, grantValid, sendReVerificationToken, SignIn, updatePassword, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken, mustAuth } from "#/middleware/auth";
import formidable from "formidable";
import path from "path";
import fs from "fs";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReVerificationToken);
router.post('/forgot-password', generateForgotPasswordLink);
router.post('/verify-password-reset-token', validate(TokenAndIDValidation), isValidPasswordResetToken,
    grantValid);
router.post('/update-password', validate(updatedPasswordSchema), isValidPasswordResetToken, updatePassword);
router.post('/sign-in', validate(SignInEmailValidationSchema), SignIn);
router.get('/is-auth', mustAuth, (req, res) => {
    res.status(200).json({
        profile: req.user
    });
});
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

router.post('/update-profile', async (req, res) => {
    if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
        return res.status(422).json({ error: "Only accepts form-data!" });

        const dir = path.join(__dirname, "../public/profiles");
        try {
            await fs.readdirSync(dir);
            
        } catch (error) {
            await fs.mkdirSync(dir)
        }
        
    const form = formidable({
        uploadDir: dir,
        filename(name, ext, part, form) {
            return Date.now() + "_" + part.originalFilename;
        },
    });
    form.parse(req, (_err, fields, files) => {
        res.status(200).json({ uploaded: true });
    });
})

export default router;