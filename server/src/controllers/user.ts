import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import emailVerificationToken from "#/models/emailVerificationToken";
import User from "#/models/User";
import { generateToken } from "#/utils/helper";
import { sendVerificationMail } from "#/utils/mail";
import { CreateUserSchema } from "#/utils/validationSchema";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";

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