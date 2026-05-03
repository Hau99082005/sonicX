import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import emailVerificationToken from "#/models/emailVerificationToken";
import User from "#/models/User";
import { generateToken } from "#/utils/helper";
import { sendForgotPasswordLink, sendPasswordResetSuccessEmail, sendVerificationMail } from "#/utils/mail";
import { CreateUserSchema } from "#/utils/validationSchema";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import passwordResetToken from "#/models/passwordResetToken";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_URL } from "#/utils/variables";
import jwt from "jsonwebtoken";

export const create: RequestHandler = async (req: CreateUser, res) => {
    try {
        const { name, email, password } = req.body;
        CreateUserSchema.validate({ email, name, password });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });
        const token = generateToken()
        await emailVerificationToken.create({
            owner: newUser._id.toString(),
            token,
        });
        sendVerificationMail(token, { name, email, userId: newUser._id.toString() });


        return res.status(201).json({
            message: "Tạo user thành công",
            user: { id: newUser._id, name, email }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error
        });
    }
}

export const verifyEmail: RequestHandler = async (req: VerifyEmailRequest, res) => {
    const { token, userId } = req.body;
    const verificationToken = await emailVerificationToken.findOne({
        owner: userId,
    })

    if (!verificationToken) return res.status(403).json({ error: "Invalid token!" });
    const matched = await verificationToken.compareToken(token);
    if (!matched) return res.status(403).json({ error: "Invalid token!" });

    await User.findByIdAndUpdate(userId, {
        verified: true
    });
    await emailVerificationToken.findByIdAndDelete(verificationToken._id);
    res.status(200).json({ message: "Email verified successfully!" });

}

export const sendReVerificationToken: RequestHandler = async (req, res) => {
    const { userId } = req.body;
    if (!isValidObjectId(userId)) return res.status(403).json({ error: "Invalid request!" });
    const user = await User.findById(userId);
    if (!user) return res.status(403).json({ error: "Invalid request!" });

    await emailVerificationToken.findOneAndDelete({
        owner: userId,
    });
    const token = generateToken();
    await emailVerificationToken.create({
        owner: userId,
        token
    });
    sendVerificationMail(token, {
        name: user?.name,
        email: user?.email,
        userId: user?._id.toString(),
    });

    res.status(200).json({ message: "Please check your email for verification!" });
}

export const generateForgotPasswordLink: RequestHandler = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Account not found!" });
    await passwordResetToken.findOneAndDelete({
        owner: user._id.toString(),

    })
    const token = crypto.randomBytes(36).toString('hex');
    await passwordResetToken.create({
        owner: user._id.toString(),
        token
    });
    const resetLink = `${PASSWORD_RESET_URL}?token=${token}&userId=${user._id.toString()}`;
    sendForgotPasswordLink({
        email: user.email,
        link: resetLink
    });
    res.status(200).json({ message: "Please check your email for the password reset link!" });
}

export const grantValid: RequestHandler = async (req, res) => {
    res.status(200).json({ valid: true });
}

export const updatePassword: RequestHandler = async (req, res) => {
    const { password, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(403).json({ error: "Unauthorized access!" });
    const matched = await user.comparePassword(password);
    if (matched) return res.status(422).json({ error: "The new password must be different!" });
    user.password = password;
    await user.save();
    await passwordResetToken.findOneAndDelete({ owner: user._id.toString() });
    sendPasswordResetSuccessEmail(user.name, user.email);
    res.status(200).json({ message: "Password updated successfully!" });
}

export const SignIn: RequestHandler = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(403).json({ error: "Email/password mismatch!" });
    const matched = await user.comparePassword(password);
    if (!matched) return res.status(403).json({ error: "Email/password mismatch!" });
    const token = jwt.sign({
        userId: user._id.toString()
    }, JWT_SECRET);
    user.token.push(token);
    await user.save();

    res.status(200).json({
        profile: {
            id: user._id, name: user.name, email: user.email,
            verified: user.verified, avatar: user.avatar?.url,
            followers: user.followers.length, following: user.followings.length
        },
        token
    })
}