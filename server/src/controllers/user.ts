import { CreateUser } from "#/@types/user";
import User from "#/models/User";
import { generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { MAILTRAP_PASS, MAILTRAP_USER } from "#/utils/variables";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import emailVerificationToken from "#/models/emailVerificationToken";
import nodemailer from "nodemailer";

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


        //gửi email xác minh
        const transport = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: MAILTRAP_USER,
                pass: MAILTRAP_PASS
            }
        });

        //token = 6 digit otp => vd: 123456 => gửi
        //token = đính kèm các mã thông báo này vào <a href="">=> xác thực
        const token = generateToken();
        emailVerificationToken.create({
            owner: newUser._id,
            token,
        });



        transport.sendMail({
            to: newUser.email,
            from: "auth@sonicX.com",
            html:  `<h1>${token}</h1>`
        })

        return res.status(201).json({
            message: "Tạo user thành công",
            user: newUser
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error
        });
    }
}