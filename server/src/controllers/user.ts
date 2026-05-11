import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import emailVerificationToken from "#/models/emailVerificationToken";
import User from "#/models/User";
import { formatProfile, generateToken } from "#/utils/helper";
import { sendForgotPasswordLink, sendPasswordResetSuccessEmail, sendVerificationMail } from "#/utils/mail";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import passwordResetToken from "#/models/passwordResetToken";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_URL } from "#/utils/variables";
import jwt from "jsonwebtoken";
import cloudinary from "#/cloud";
import formidable from "formidable";
import { auth as adminAuth } from "#/firebase/server";

export const create: RequestHandler = async (req: CreateUser, res) => {
    try {
        const { name, email, password } = req.body;
        const oldUser = await User.findOne({
            email
        });
        if (oldUser) return res.status(403).json({ error: "Email is already in use!" });
        CreateUserSchema.validate({ email, name, password });

        const newUser = await User.create({
            name,
            email,
            password
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

    if (user.verified) return res.status(422).json({ error: "You account is already verified!" });

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
    });
}

export const updateProfile: RequestHandler = async (req, res) => {
    const { name } = req.body;
    const avatar = req.files?.avatar as formidable.File;

    const user = await User.findById(req.user.id);
    if (!user) throw new Error("something went wrong, user not found!");
    if (typeof name !== "string") return res.status(422).json({ error: "Invalid name!" });
    if (name.trim().length < 3) return res.status(422).json({ error: "Name must be at least 3 characters long!" });
    user.name = name;
    if (avatar) {
        //if these is already an avatar file, we want to remove that
        if (user.avatar?.publicId) {
            await cloudinary.uploader.destroy(user.avatar.publicId);
        }

        //upload new avatar file
        const { secure_url, public_id } = await cloudinary.uploader.upload(avatar.filepath, {
            width: 400,
            height: 400,
            crop: "thumb",
            gravity: "face"
        });
        user.avatar = { url: secure_url, publicId: public_id };
    }
    await user.save();
    res.status(200).json({ profile: formatProfile(user) });
}

export const sendProfile: RequestHandler = (req, res) => {
    res.status(200).json({ profile: req.user });
}

export const logOut: RequestHandler = async (req, res) => {
    const { fromAll } = req.query;
    const token = req.token;
    const user = await User.findById(req.user.id);
    if (!user) throw new Error("something went wrong, user not found!");
    if (fromAll === "yes") user.token = []
    else user.token = user.token.filter((tokens) => tokens !== token);

    await user.save();
    res.status(200).json({ success: true });
}

export const getUser: RequestHandler = async (req, res) => {
    const user = await User.find({}).sort({ createdAt: -1 });
    if (user) {
        return res.status(200).json({ user });
    } else {
        return res.status(404).json({ message: "User not found!" });
    }
}

export const googleSignIn: RequestHandler = async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(422).json({ error: "idToken is required!" });

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;

        if (!email) return res.status(422).json({ error: "Google account must have an email!" });

        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = new User({
                name: name || email.split("@")[0],
                email,
                password: crypto.randomBytes(32).toString("hex"),
                verified: false,
            });
            if (picture) {
                user.avatar = { url: picture, publicId: "" };
            }
            await user.save();

            const otp = generateToken();
            await emailVerificationToken.create({
                owner: user._id.toString(),
                token: otp,
            });
            sendVerificationMail(otp, {
                name: user.name,
                email: user.email,
                userId: user._id.toString(),
            });
        }

        const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET);
        user.token.push(token);
        await user.save();

        return res.status(200).json({
            profile: {
                id: user._id,
                name: user.name,
                email: user.email,
                verified: user.verified,
                avatar: user.avatar?.url,
                followers: user.followers.length,
                following: user.followings.length,
            },
            token,
            message: isNewUser ? "Vui lòng kiểm tra email để xác thực tài khoản!" : undefined,
        });
    } catch (error) {
        console.error("Google sign-in error:", error);
        return res.status(401).json({ error: "Invalid or expired Google token!", detail: (error as Error).message });
    }
};